package com.vibhu.security.jwt.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vibhu.security.jwt.entity.RefreshToken;
import com.vibhu.security.jwt.entity.Role;
import com.vibhu.security.jwt.entity.User;
import com.vibhu.security.jwt.exception.InvalidTokenException;
import com.vibhu.security.jwt.repository.RefreshTokenRepository;
import com.vibhu.security.jwt.repository.RoleRepository;
import com.vibhu.security.jwt.repository.UserRepository;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class RefreshTokenServiceTest {

  @Autowired RefreshTokenService refreshTokenService;
  @Autowired UserRepository userRepository;
  @Autowired RoleRepository roleRepository;
  @Autowired RefreshTokenRepository refreshTokenRepository;

  User user;

  @BeforeEach
  void setUp() {
    Role role = roleRepository.findByName("ROLE_USER").orElseThrow();
    user =
        userRepository
            .findByEmailIgnoreCase("user@example.com")
            .orElseGet(
                () -> {
                  User created = new User();
                  created.setEmail("refresh-user@example.com");
                  created.setPasswordHash("hash");
                  created.setRoles(Set.of(role));
                  return userRepository.save(created);
                });
  }

  @Test
  void issueAndRequireActive() {
    var issued = refreshTokenService.issue(user);
    RefreshToken stored = refreshTokenService.requireActive(issued.rawToken());
    assertThat(stored.isRevoked()).isFalse();
    assertThat(stored.getTokenHash()).isEqualTo(RefreshTokenService.hash(issued.rawToken()));
  }

  @Test
  void rotateRevokesOldToken() {
    var first = refreshTokenService.issue(user);
    var second = refreshTokenService.rotate(first.rawToken());
    assertThat(second.rawToken()).isNotEqualTo(first.rawToken());
    assertThatThrownBy(() -> refreshTokenService.requireActive(first.rawToken()))
        .isInstanceOf(InvalidTokenException.class);
    assertThat(refreshTokenService.requireActive(second.rawToken()).getFamilyId())
        .isEqualTo(first.entity().getFamilyId());
  }

  @Test
  void reuseOfRevokedTokenRevokesFamily() {
    var first = refreshTokenService.issue(user);
    var second = refreshTokenService.rotate(first.rawToken());
    assertThatThrownBy(() -> refreshTokenService.rotate(first.rawToken()))
        .isInstanceOf(InvalidTokenException.class)
        .hasMessageContaining("reuse");
    RefreshToken latest =
        refreshTokenRepository
            .findByTokenHash(RefreshTokenService.hash(second.rawToken()))
            .orElseThrow();
    assertThat(latest.isRevoked()).isTrue();
  }

  @Test
  void revokeMarksTokenUnusable() {
    var issued = refreshTokenService.issue(user);
    refreshTokenService.revoke(issued.rawToken());
    assertThatThrownBy(() -> refreshTokenService.requireActive(issued.rawToken()))
        .isInstanceOf(InvalidTokenException.class);
  }
}
