package com.vibhu.security.jwt.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vibhu.security.jwt.entity.Role;
import com.vibhu.security.jwt.entity.User;
import com.vibhu.security.jwt.exception.InvalidTokenException;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

  @Mock JwtService jwtService;
  @Mock UserDetailsService userDetailsService;
  @Mock AccessTokenDenylist denylist;
  @Mock RestAuthenticationEntryPoint entryPoint;
  @Mock FilterChain chain;

  JwtAuthenticationFilter filter;

  @BeforeEach
  void setUp() {
    SecurityContextHolder.clearContext();
    filter = new JwtAuthenticationFilter(jwtService, userDetailsService, denylist, entryPoint);
  }

  @Test
  void missingHeaderContinuesAnonymous() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
    MockHttpServletResponse response = new MockHttpServletResponse();
    filter.doFilter(request, response, chain);
    verify(chain).doFilter(request, response);
    assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
  }

  @Test
  void validBearerPopulatesContext() throws Exception {
    Role role = new Role();
    role.setName("ROLE_USER");
    User user = new User();
    user.setEmail("user@example.com");
    user.setPasswordHash("hash");
    user.setRoles(java.util.Set.of(role));
    CustomUserDetails details = new CustomUserDetails(user);

    when(jwtService.extractUsername("good.token")).thenReturn("user@example.com");
    when(jwtService.extractJti("good.token")).thenReturn("jti-1");
    when(denylist.isRevoked("jti-1")).thenReturn(false);
    when(userDetailsService.loadUserByUsername("user@example.com")).thenReturn(details);

    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
    request.addHeader("Authorization", "Bearer good.token");
    MockHttpServletResponse response = new MockHttpServletResponse();
    filter.doFilter(request, response, chain);

    verify(chain).doFilter(request, response);
    assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    assertThat(SecurityContextHolder.getContext().getAuthentication().getName())
        .isEqualTo("user@example.com");
  }

  @Test
  void invalidJwtWrites401() throws Exception {
    when(jwtService.extractUsername("bad"))
        .thenThrow(new InvalidTokenException("Invalid access token"));
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
    request.addHeader("Authorization", "Bearer bad");
    MockHttpServletResponse response = new MockHttpServletResponse();
    filter.doFilter(request, response, chain);
    verify(entryPoint)
        .write(response, 401, "Unauthorized", "Invalid or expired access token", request);
    assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
  }
}
