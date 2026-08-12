package com.vibhu.whatsapp.messageservice;

import com.vibhu.whatsapp.common.dto.ConversationView;
import com.vibhu.whatsapp.common.dto.CreateDirectConversationRequest;
import com.vibhu.whatsapp.common.dto.MessageView;
import com.vibhu.whatsapp.common.dto.RegisterUserRequest;
import com.vibhu.whatsapp.common.dto.SendMessageRequest;
import com.vibhu.whatsapp.common.dto.UserView;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MessageServiceFlowTest {
    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void sendsMessageIdempotentlyAndSyncsByConversationSequence() {
        ResponseEntity<UserView> alice = restTemplate.postForEntity(
                "/api/v1/users",
                new RegisterUserRequest("alice", "Alice", "+15550001"),
                UserView.class
        );
        ResponseEntity<UserView> bob = restTemplate.postForEntity(
                "/api/v1/users",
                new RegisterUserRequest("bob", "Bob", "+15550002"),
                UserView.class
        );
        assertThat(alice.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(bob.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<ConversationView> conversationResponse = restTemplate.postForEntity(
                "/api/v1/conversations/direct",
                new CreateDirectConversationRequest("alice", "bob"),
                ConversationView.class
        );
        assertThat(conversationResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        ConversationView conversation = conversationResponse.getBody();
        assertThat(conversation).isNotNull();

        HttpHeaders sendHeaders = new HttpHeaders();
        sendHeaders.setContentType(MediaType.APPLICATION_JSON);
        sendHeaders.set("X-User-Id", "alice");
        sendHeaders.set("Idempotency-Key", "client-msg-1");
        SendMessageRequest sendRequest = new SendMessageRequest(
                "client-msg-1",
                "bob",
                "opaque-ciphertext"
        );

        ResponseEntity<MessageView> firstSend = restTemplate.exchange(
                "/api/v1/conversations/{conversationId}/messages",
                HttpMethod.POST,
                new HttpEntity<>(sendRequest, sendHeaders),
                MessageView.class,
                conversation.conversationId()
        );
        assertThat(firstSend.getStatusCode()).isEqualTo(HttpStatus.OK);
        MessageView firstMessage = firstSend.getBody();
        assertThat(firstMessage).isNotNull();
        assertThat(firstMessage.serverSeq()).isEqualTo(1);

        ResponseEntity<MessageView> retrySend = restTemplate.exchange(
                "/api/v1/conversations/{conversationId}/messages",
                HttpMethod.POST,
                new HttpEntity<>(sendRequest, sendHeaders),
                MessageView.class,
                conversation.conversationId()
        );
        assertThat(retrySend.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(retrySend.getBody()).isNotNull();
        assertThat(retrySend.getBody().serverMsgId()).isEqualTo(firstMessage.serverMsgId());
        assertThat(retrySend.getBody().serverSeq()).isEqualTo(1);

        HttpHeaders syncHeaders = new HttpHeaders();
        syncHeaders.set("X-User-Id", "bob");
        ResponseEntity<List<MessageView>> syncResponse = restTemplate.exchange(
                "/api/v1/conversations/{conversationId}/messages?afterSeq=0",
                HttpMethod.GET,
                new HttpEntity<>(syncHeaders),
                new ParameterizedTypeReference<>() {
                },
                conversation.conversationId()
        );

        assertThat(syncResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(syncResponse.getBody())
                .hasSize(1)
                .first()
                .satisfies(message -> {
                    assertThat(message.serverMsgId()).isEqualTo(firstMessage.serverMsgId());
                    assertThat(message.serverSeq()).isEqualTo(1);
                    assertThat(message.encryptedPayload()).isEqualTo("opaque-ciphertext");
                });
    }
}
