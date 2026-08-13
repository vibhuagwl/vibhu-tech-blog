package com.vibhu.security.attacks.xss;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.util.HtmlUtils;

@Controller
@RequestMapping("/xss")
public class XssController {

  /** BAD: puts untrusted input into the model for th:utext (raw HTML). */
  @GetMapping("/bad")
  public String bad(@RequestParam(defaultValue = "world") String name, Model model) {
    model.addAttribute("name", name);
    model.addAttribute("mode", "BAD — th:utext (unescaped)");
    return "xss-bad";
  }

  /** GOOD: Thymeleaf th:text escapes HTML by default. */
  @GetMapping("/good")
  public String good(@RequestParam(defaultValue = "world") String name, Model model) {
    model.addAttribute("name", name);
    model.addAttribute("mode", "GOOD — th:text (escaped)");
    return "xss-good";
  }

  /** GOOD: encode before returning HTML string APIs. */
  @GetMapping("/api/good")
  @ResponseBody
  public String apiGood(@RequestParam(defaultValue = "world") String name) {
    return "<html><body>Hello " + HtmlUtils.htmlEscape(name) + "</body></html>";
  }

  /** BAD: string HTML API without encoding — reflected XSS. */
  @GetMapping("/api/bad")
  @ResponseBody
  public String apiBad(@RequestParam(defaultValue = "world") String name) {
    return "<html><body>Hello " + name + "</body></html>";
  }
}
