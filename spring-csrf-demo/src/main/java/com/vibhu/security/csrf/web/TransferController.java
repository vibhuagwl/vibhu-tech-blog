package com.vibhu.security.csrf.web;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class TransferController {
  private final List<String> ledger = new CopyOnWriteArrayList<>();

  @GetMapping("/")
  public String home() {
    return "index";
  }

  @GetMapping("/login")
  public String login() {
    return "login";
  }

  @GetMapping("/transfer")
  public String transferForm(Model model) {
    model.addAttribute("ledger", new ArrayList<>(ledger));
    return "transfer";
  }

  /**
   * State-changing POST. Spring Security requires a valid CSRF token (_csrf form field or
   * X-XSRF-TOKEN header) or the request is rejected with 403.
   */
  @PostMapping("/transfer")
  public String transfer(
      @RequestParam String toAccount,
      @RequestParam String amount,
      RedirectAttributes redirectAttributes) {
    String entry = "Transferred ₹" + amount + " → " + toAccount;
    ledger.add(entry);
    redirectAttributes.addFlashAttribute("message", entry + " (CSRF token accepted)");
    return "redirect:/transfer";
  }
}
