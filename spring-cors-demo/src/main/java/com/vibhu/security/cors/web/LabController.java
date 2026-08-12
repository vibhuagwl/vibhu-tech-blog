package com.vibhu.security.cors.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LabController {
  @GetMapping("/")
  public String home() {
    return "index";
  }
}
