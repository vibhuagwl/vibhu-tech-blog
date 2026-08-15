package com.vibhu.security.csrf.web;

import java.util.Map;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * SPA-style endpoints using CookieCsrfTokenRepository. JS reads the non-HttpOnly XSRF-TOKEN cookie
 * and sends X-XSRF-TOKEN on mutating calls.
 */
@RestController
@RequestMapping("/spa")
public class SpaTransferController {

  @GetMapping("/csrf")
  public Map<String, String> csrf(CsrfToken token) {
    return Map.of(
        "headerName", token.getHeaderName(),
        "parameterName", token.getParameterName(),
        "token", token.getToken());
  }

  @PostMapping("/transfer")
  public Map<String, String> transfer(@RequestParam String toAccount, @RequestParam String amount) {
    return Map.of("status", "OK", "message", "SPA transfer ₹" + amount + " → " + toAccount);
  }
}
