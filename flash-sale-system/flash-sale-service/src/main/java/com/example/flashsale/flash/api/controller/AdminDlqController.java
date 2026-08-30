package com.example.flashsale.flash.api.controller;

import com.example.flashsale.flash.application.service.KafkaDlqReplayService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dlq")
@Profile("!test")
public class AdminDlqController {

    private final KafkaDlqReplayService replayService;

    public AdminDlqController(KafkaDlqReplayService replayService) {
        this.replayService = replayService;
    }

    @PostMapping("/replay")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATIONS')")
    public ResponseEntity<Void> replay(@RequestBody ReplayRequest request) {
        replayService.replay(request.dlqTopic(), request.payload());
        return ResponseEntity.accepted()
                .build();
    }

    public record ReplayRequest(String dlqTopic, String payload) {
    }
}
