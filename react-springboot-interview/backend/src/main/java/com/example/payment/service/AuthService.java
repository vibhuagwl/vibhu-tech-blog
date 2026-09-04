package com.example.payment.service;

import com.example.payment.dto.LoginRequest;
import com.example.payment.dto.LoginResponse;
import com.example.payment.entity.AppUser;
import com.example.payment.repository.AppUserRepository;
import com.example.payment.security.JwtService;
import com.example.payment.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService,
            AppUserRepository appUserRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.appUserRepository = appUserRepository;
    }

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.username(),
                request.password()));
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        AppUser user = appUserRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("Authenticated user missing"));
        String token = jwtService.generateToken(user.getUsername(), user.getRole());
        return new LoginResponse(token,
                user.getRole()
                        .name(),
                user.getUsername());
    }
}
