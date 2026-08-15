package com.vibhu.security.jwt.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vibhu.security.jwt.entity.Role;
import com.vibhu.security.jwt.entity.User;
import com.vibhu.security.jwt.repository.UserRepository;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

  @Mock UserRepository userRepository;

  @InjectMocks CustomUserDetailsService service;

  @Test
  void loadsByEmailAndMapsRoles() {
    Role role = new Role();
    role.setName("ROLE_USER");
    User user = new User();
    user.setEmail("user@example.com");
    user.setPasswordHash("hash");
    user.setRoles(Set.of(role));
    Mockito.when(userRepository.findByEmailIgnoreCase("user@example.com"))
        .thenReturn(Optional.of(user));

    UserDetails details = service.loadUserByUsername("user@example.com");
    assertThat(details.getUsername()).isEqualTo("user@example.com");
    assertThat(details.getAuthorities()).extracting("authority").containsExactly("ROLE_USER");
  }

  @Test
  void missingUser() {
    Mockito.when(userRepository.findByEmailIgnoreCase("missing@example.com"))
        .thenReturn(Optional.empty());
    assertThatThrownBy(() -> service.loadUserByUsername("missing@example.com"))
        .isInstanceOf(UsernameNotFoundException.class);
  }
}
