package com.vibhu.security.attacks.sqli;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sqli")
public class SqlInjectionController {
  private final JdbcTemplate jdbc;

  public SqlInjectionController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  /**
   * BAD — concatenates user input into SQL.
   * Example abuse: q=electronics' OR '1'='1
   */
  @GetMapping("/bad")
  public List<Map<String, Object>> bad(@RequestParam String q) {
    String sql = "SELECT id, name, category FROM products WHERE category = '" + q + "'";
    return jdbc.queryForList(sql);
  }

  /** GOOD — parameterized query; payload cannot change SQL structure. */
  @GetMapping("/good")
  public List<Map<String, Object>> good(@RequestParam String q) {
    return jdbc.queryForList(
        "SELECT id, name, category FROM products WHERE category = ?",
        q);
  }
}
