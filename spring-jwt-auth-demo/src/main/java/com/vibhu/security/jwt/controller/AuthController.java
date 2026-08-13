package com.vibhu.security.jwt.controller;

import com.vibhu.security.jwt.dto.AuthResponse;
import com.vibhu.security.jwt.dto.LoginRequest;
import com.vibhu.security.jwt.dto.LogoutRequest;
import com.vibhu.security.jwt.dto.RefreshTokenRequest;
import com.vibhu.security.jwt.dto.RegisterRequest;
import com.vibhu.security.jwt.dto.UserResponse;
import com.vibhu.security.jwt.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @Valid @RequestBody LogoutRequest request,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        String access = null;
        if (authorization != null && authorization.startsWith("Bearer ")) {
            access = authorization.substring("Bearer ".length()).trim();
        }
        authService.logout(request, access);
        return ResponseEntity.noContent().build();
    }
}
