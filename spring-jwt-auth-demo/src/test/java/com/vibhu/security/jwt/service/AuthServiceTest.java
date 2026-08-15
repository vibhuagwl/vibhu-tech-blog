package com.vibhu.security.jwt.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vibhu.security.jwt.dto.LoginRequest;
import com.vibhu.security.jwt.dto.RegisterRequest;
import com.vibhu.security.jwt.dto.UserResponse;
import com.vibhu.security.jwt.exception.DuplicateUserException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class AuthServiceTest {

  @Autowired AuthService authService;

  @Test
  void registerThenLogin() {
    UserResponse created =
        authService.register(new RegisterRequest("svc@example.com", "StrongPassword123!"));
    assertThat(created.email()).isEqualTo("svc@example.com");
    assertThat(created.roles()).contains("ROLE_USER");
    var tokens = authService.login(new LoginRequest("svc@example.com", "StrongPassword123!"));
    assertThat(tokens.accessToken()).isNotBlank();
    assertThat(tokens.refreshToken()).isNotBlank();
    assertThat(tokens.tokenType()).isEqualTo("Bearer");
  }

  @Test
  void duplicateRegister() {
    assertThatThrownBy(
            () ->
                authService.register(new RegisterRequest("user@example.com", "StrongPassword123!")))
        .isInstanceOf(DuplicateUserException.class);
  }

  @Test
  void invalidPassword() {
    assertThatThrownBy(
            () -> authService.login(new LoginRequest("user@example.com", "nope-nope-nope")))
        .isInstanceOf(BadCredentialsException.class);
  }
}
