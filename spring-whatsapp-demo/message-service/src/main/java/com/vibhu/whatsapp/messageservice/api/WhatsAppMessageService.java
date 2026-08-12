package com.vibhu.whatsapp.messageservice.api;

import com.vibhu.whatsapp.common.dto.AckRequest;
import com.vibhu.whatsapp.common.dto.AckView;
import com.vibhu.whatsapp.common.dto.ConversationView;
import com.vibhu.whatsapp.common.dto.CreateDirectConversationRequest;
import com.vibhu.whatsapp.common.dto.MessageView;
import com.vibhu.whatsapp.common.dto.PresenceHeartbeatRequest;
import com.vibhu.whatsapp.common.dto.PresenceView;
import com.vibhu.whatsapp.common.dto.RegisterUserRequest;
import com.vibhu.whatsapp.common.dto.SendMessageRequest;
import com.vibhu.whatsapp.common.dto.UserView;
import com.vibhu.whatsapp.common.events.MessageCreatedEvent;
import com.vibhu.whatsapp.messageservice.delivery.LocalDeliveryCoordinator;
import com.vibhu.whatsapp.messageservice.messaging.MessageEventPublisher;
import com.vibhu.whatsapp.messageservice.model.AckRecord;
import com.vibhu.whatsapp.messageservice.model.ConversationRecord;
import com.vibhu.whatsapp.messageservice.model.MessageRecord;
import com.vibhu.whatsapp.messageservice.model.OutboxRecord;
import com.vibhu.whatsapp.messageservice.model.UserRecord;
import com.vibhu.whatsapp.messageservice.presence.PresenceStore;
import com.vibhu.whatsapp.messageservice.store.AckRepository;
import com.vibhu.whatsapp.messageservice.store.ConversationRepository;
import com.vibhu.whatsapp.messageservice.store.MessagePersistResult;
import com.vibhu.whatsapp.messageservice.store.MessageRepository;
import com.vibhu.whatsapp.messageservice.store.OutboxRepository;
import com.vibhu.whatsapp.messageservice.store.UserRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class WhatsAppMessageService {
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AckRepository ackRepository;
    private final OutboxRepository outboxRepository;
    private final PresenceStore presenceStore;
    private final MessageEventPublisher messageEventPublisher;
    private final ObjectProvider<LocalDeliveryCoordinator> localDeliveryCoordinator;

    public WhatsAppMessageService(
            UserRepository userRepository,
            ConversationRepository conversationRepository,
            MessageRepository messageRepository,
            AckRepository ackRepository,
            OutboxRepository outboxRepository,
            PresenceStore presenceStore,
            MessageEventPublisher messageEventPublisher,
            ObjectProvider<LocalDeliveryCoordinator> localDeliveryCoordinator
    ) {
        this.userRepository = userRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.ackRepository = ackRepository;
        this.outboxRepository = outboxRepository;
        this.presenceStore = presenceStore;
        this.messageEventPublisher = messageEventPublisher;
        this.localDeliveryCoordinator = localDeliveryCoordinator;
    }

    public UserView registerUser(RegisterUserRequest request) {
        requireText(request.userId(), "userId");
        requireText(request.displayName(), "displayName");
        requireText(request.phone(), "phone");
        return userRepository.save(new UserRecord(request.userId(), request.displayName(), request.phone())).toView();
    }

    public ConversationView createDirectConversation(CreateDirectConversationRequest request) {
        requireText(request.userA(), "userA");
        requireText(request.userB(), "userB");
        if (request.userA().equals(request.userB())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Direct conversation needs two different users");
        }
        requireUser(request.userA());
        requireUser(request.userB());
        return conversationRepository.createDirect(request.userA(), request.userB()).toView();
    }

    public MessageView sendMessage(
            String conversationId,
            String senderId,
            String idempotencyKeyHeader,
            SendMessageRequest request
    ) {
        requireText(conversationId, "conversationId");
        requireText(senderId, "X-User-Id");
        requireText(request.recipientId(), "recipientId");
        requireText(request.encryptedPayload(), "encryptedPayload");
        String clientMsgId = firstNonBlank(request.clientMsgId(), idempotencyKeyHeader);
        requireText(clientMsgId, "clientMsgId");

        requireUser(senderId);
        requireUser(request.recipientId());
        ConversationRecord conversation = requireConversation(conversationId);
        if (!conversation.includes(senderId) || !conversation.includes(request.recipientId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Sender and recipient must belong to conversation");
        }
        if (senderId.equals(request.recipientId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sender and recipient must be different");
        }

        MessagePersistResult persistResult = messageRepository.saveIfAbsent(
                conversationId,
                senderId,
                request.recipientId(),
                clientMsgId,
                request.encryptedPayload()
        );

        if (persistResult.created()) {
            publishAfterPersist(persistResult.message());
        }
        return persistResult.message().toView();
    }

    public List<MessageView> syncMessages(String conversationId, String requesterId, long afterSeq) {
        ConversationRecord conversation = requireConversation(conversationId);
        if (requesterId != null && !requesterId.isBlank() && !conversation.includes(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Requester must belong to conversation");
        }
        return messageRepository.findConversationMessagesAfter(conversationId, afterSeq).stream()
                .map(MessageRecord::toView)
                .toList();
    }

    public AckView acknowledge(String serverMsgId, AckRequest request) {
        requireText(serverMsgId, "serverMsgId");
        requireText(request.userId(), "userId");
        requireText(request.deviceId(), "deviceId");
        if (request.type() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type is required");
        }
        MessageRecord message = messageRepository.findById(serverMsgId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
        if (!message.recipientId().equals(request.userId()) && !message.senderId().equals(request.userId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ACK user must be a message participant");
        }
        AckRecord ack = ackRepository.save(serverMsgId, request.userId(), request.deviceId(), request.type());
        return ack.toView();
    }

    public PresenceView heartbeat(PresenceHeartbeatRequest request) {
        requireText(request.userId(), "userId");
        requireText(request.deviceId(), "deviceId");
        requireText(request.gatewayNode(), "gatewayNode");
        requireUser(request.userId());
        PresenceView presence = presenceStore.heartbeat(request);
        localDeliveryCoordinator.ifAvailable(coordinator -> coordinator.deliverPendingFor(request.userId()));
        return presence;
    }

    public PresenceView findPresence(String userId) {
        requireText(userId, "userId");
        return presenceStore.find(userId);
    }

    private void publishAfterPersist(MessageRecord message) {
        MessageCreatedEvent event = message.toEvent();
        OutboxRecord outboxRecord = outboxRepository.save(new OutboxRecord(
                "outbox_" + UUID.randomUUID(),
                message.serverMsgId(),
                MessageCreatedEvent.class.getSimpleName(),
                event,
                Instant.now(),
                false
        ));
        messageEventPublisher.publish(event);
        outboxRepository.markPublished(outboxRecord.outboxId());
    }

    private UserRecord requireUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));
    }

    private ConversationRecord requireConversation(String conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
    }

    private void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return second;
    }
}
