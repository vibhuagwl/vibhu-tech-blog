package com.vibhu.security.idanywhere.api.payment;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public List<Map<String, Object>> list(@AuthenticationPrincipal Jwt jwt) {
        return List.of(Map.of("id",
                "pay-1001",
                "owner",
                jwt.getClaimAsString("upn") != null ? jwt.getClaimAsString("upn") : jwt.getSubject(),
                "amount",
                42.50,
                "groups",
                jwt.getClaim("groups") != null ? jwt.getClaim("groups") : List.of()));
    }
}
