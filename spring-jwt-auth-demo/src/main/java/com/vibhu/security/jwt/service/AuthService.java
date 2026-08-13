package com.vibhu.security.jwt.service;

import com.vibhu.security.jwt.dto.AuthResponse;
import com.vibhu.security.jwt.dto.LoginRequest;
import com.vibhu.security.jwt.dto.LogoutRequest;
import com.vibhu.security.jwt.dto.RefreshTokenRequest;
import com.vibhu.security.jwt.dto.RegisterRequest;
import com.vibhu.security.jwt.dto.UserResponse;
import com.vibhu.security.jwt.entity.Role;
import com.vibhu.security.jwt.entity.User;
import com.vibhu.security.jwt.exception.DuplicateUserException;
import com.vibhu.security.jwt.exception.InvalidTokenException;
import com.vibhu.security.jwt.repository.RoleRepository;
import com.vibhu.security.jwt.repository.UserRepository;
import com.vibhu.security.jwt.security.AccessTokenDenylist;
import com.vibhu.security.jwt.security.CustomUserDetails;
import com.vibhu.security.jwt.security.JwtService;
import com.vibhu.security.jwt.security.LoginAttemptService;
import io.jsonwebtoken.Claims;
import java.time.Instant;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final LoginAttemptService loginAttemptService;
    private final AccessTokenDenylist accessTokenDenylist;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            LoginAttemptService loginAttemptService,
            AccessTokenDenylist accessTokenDenylist) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.loginAttemptService = loginAttemptService;
        this.accessTokenDenylist = accessTokenDenylist;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateUserException("Email already registered");
        }
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("ROLE_USER missing"));
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEnabled(true);
        user.setRoles(Set.of(userRole));
        user.setCreatedAt(Instant.now());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        loginAttemptService.assertNotLocked(email);
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (RuntimeException ex) {
            loginAttemptService.loginFailed(email);
            log.info("Authentication failed for userIdHash={}", Integer.toHexString(email.hashCode()));
            throw ex;
        }
        loginAttemptService.loginSucceeded(email);
        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        return issueTokens(principal.getUser());
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshTokenService.IssuedRefreshToken rotated = refreshTokenService.rotate(request.refreshToken());
        return issueAccessAndRefresh(rotated.entity().getUser(), rotated.rawToken());
    }

    @Transactional
    public void logout(LogoutRequest request, String accessToken) {
        refreshTokenService.revoke(request.refreshToken());
        if (accessToken != null && !accessToken.isBlank()) {
            try {
                Claims claims = jwtService.validateToken(accessToken);
                Instant exp = claims.getExpiration() == null ? Instant.now() : claims.getExpiration().toInstant();
                accessTokenDenylist.revoke(claims.getId(), exp);
            } catch (InvalidTokenException ignored) {
                // already invalid — refresh token still revoked
            }
        }
    }

    public static UserResponse toResponse(User user) {
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        return new UserResponse(user.getId(), user.getEmail(), roles, user.isEnabled());
    }

    private AuthResponse issueTokens(User user) {
        RefreshTokenService.IssuedRefreshToken refresh = refreshTokenService.issue(user);
        return issueAccessAndRefresh(user, refresh.rawToken());
    }

    private AuthResponse issueAccessAndRefresh(User user, String refreshRaw) {
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        String access = jwtService.generateAccessToken(user.getEmail(), roles);
        return AuthResponse.of(access, refreshRaw, jwtService.accessTokenExpiresInSeconds());
    }
}
