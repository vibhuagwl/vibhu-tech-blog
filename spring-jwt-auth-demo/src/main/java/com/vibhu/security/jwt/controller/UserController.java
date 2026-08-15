package com.vibhu.security.jwt.controller;

import com.vibhu.security.jwt.dto.UserResponse;
import com.vibhu.security.jwt.security.CustomUserDetails;
import com.vibhu.security.jwt.service.AuthService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

  @GetMapping("/me")
  @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
  public UserResponse me(@AuthenticationPrincipal CustomUserDetails principal) {
    return AuthService.toResponse(principal.getUser());
  }
}
