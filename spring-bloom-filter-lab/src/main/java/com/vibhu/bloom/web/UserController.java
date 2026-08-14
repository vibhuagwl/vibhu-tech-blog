package com.vibhu.bloom.web;

import com.vibhu.bloom.service.BloomFilterService;
import com.vibhu.bloom.service.UserService;
import com.vibhu.bloom.user.UserEntity;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Validated
public class UserController {

  private final UserService users;
  private final BloomFilterService bloom;

  public UserController(UserService users, BloomFilterService bloom) {
    this.users = users;
    this.bloom = bloom;
  }

  @GetMapping("/users/{id}")
  public ResponseEntity<?> getUser(@PathVariable String id) {
    return users.findUser(id)
        .<ResponseEntity<?>>map(u -> ResponseEntity.ok(toDto(u)))
        .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "error", "not_found",
            "userId", id,
            "bloomMightContain", bloom.mightContain(id)
        )));
  }

  /**
   * Lab-only: skip Bloom to demonstrate cache/DB penetration cost for random missing ids.
   */
  @GetMapping("/lab/users/{id}")
  public ResponseEntity<?> getUserBypass(@PathVariable String id) {
    return users.findUserBypassingBloom(id)
        .<ResponseEntity<?>>map(u -> ResponseEntity.ok(toDto(u)))
        .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
            "error", "not_found",
            "bypassedBloom", true
        )));
  }

  @PostMapping("/users")
  public ResponseEntity<?> create(@RequestBody @Validated CreateUserRequest req) {
    UserEntity saved = users.createUser(req.id(), req.displayName(), req.email());
    return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
  }

  @PostMapping("/bloom/rebuild")
  public Map<String, Object> rebuild() {
    bloom.rebuildFromDatabase();
    return Map.of("status", "rebuilt", "stats", bloom.stats());
  }

  @GetMapping("/bloom/stats")
  public BloomFilterService.BloomFilterStats stats() {
    return bloom.stats();
  }

  @GetMapping("/bloom/might-contain")
  public Map<String, Object> mightContain(@RequestParam String id) {
    boolean maybe = bloom.mightContain(id);
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("id", id);
    body.put("mightContain", maybe);
    body.put("meaning", maybe ? "MAYBE present — check cache/DB" : "DEFINITELY absent");
    return body;
  }

  private static Map<String, Object> toDto(UserEntity u) {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("id", u.getId());
    m.put("displayName", u.getDisplayName());
    m.put("email", u.getEmail());
    m.put("createdAt", u.getCreatedAt().toString());
    return m;
  }

  public record CreateUserRequest(
      @NotBlank String id,
      @NotBlank String displayName,
      @NotBlank @Email String email
  ) {}
}
