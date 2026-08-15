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
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class WhatsAppController {
  private final WhatsAppMessageService whatsAppMessageService;

  public WhatsAppController(WhatsAppMessageService whatsAppMessageService) {
    this.whatsAppMessageService = whatsAppMessageService;
  }

  @PostMapping("/users")
  public UserView registerUser(@RequestBody RegisterUserRequest request) {
    return whatsAppMessageService.registerUser(request);
  }

  @PostMapping("/conversations/direct")
  public ConversationView createDirectConversation(
      @RequestBody CreateDirectConversationRequest request) {
    return whatsAppMessageService.createDirectConversation(request);
  }

  @PostMapping("/conversations/{conversationId}/messages")
  public MessageView sendMessage(
      @PathVariable String conversationId,
      @RequestHeader("X-User-Id") String senderId,
      @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
      @RequestBody SendMessageRequest request) {
    return whatsAppMessageService.sendMessage(conversationId, senderId, idempotencyKey, request);
  }

  @GetMapping("/conversations/{conversationId}/messages")
  public List<MessageView> syncMessages(
      @PathVariable String conversationId,
      @RequestHeader(value = "X-User-Id", required = false) String requesterId,
      @RequestParam(defaultValue = "0") long afterSeq) {
    return whatsAppMessageService.syncMessages(conversationId, requesterId, afterSeq);
  }

  @PostMapping("/messages/{serverMsgId}/acks")
  public AckView acknowledge(@PathVariable String serverMsgId, @RequestBody AckRequest request) {
    return whatsAppMessageService.acknowledge(serverMsgId, request);
  }

  @PostMapping("/presence/heartbeat")
  public PresenceView heartbeat(@RequestBody PresenceHeartbeatRequest request) {
    return whatsAppMessageService.heartbeat(request);
  }

  @GetMapping("/presence/{userId}")
  public PresenceView findPresence(@PathVariable String userId) {
    return whatsAppMessageService.findPresence(userId);
  }
}
