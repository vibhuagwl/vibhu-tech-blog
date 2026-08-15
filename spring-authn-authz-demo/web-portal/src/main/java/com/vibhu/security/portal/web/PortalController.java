package com.vibhu.security.portal.web;

import com.vibhu.security.portal.payment.PaymentService;
import java.math.BigDecimal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class PortalController {

  private final PaymentService paymentService;

  public PortalController(PaymentService paymentService) {
    this.paymentService = paymentService;
  }

  @GetMapping("/")
  public String home() {
    return "index";
  }

  @GetMapping("/login")
  public String login() {
    return "login";
  }

  @GetMapping("/payments")
  public String payments(@AuthenticationPrincipal UserDetails user, Model model) {
    model.addAttribute("username", user.getUsername());
    model.addAttribute("payments", paymentService.listFor(user.getUsername()));
    return "payments";
  }

  @PostMapping("/payments")
  public String createPayment(
      @AuthenticationPrincipal UserDetails user,
      @RequestParam BigDecimal amount,
      @RequestParam(defaultValue = "") String note) {
    paymentService.create(user.getUsername(), amount, note);
    return "redirect:/payments";
  }

  @GetMapping("/admin")
  public String admin(Model model) {
    model.addAttribute("payments", paymentService.listAll());
    return "admin";
  }
}
