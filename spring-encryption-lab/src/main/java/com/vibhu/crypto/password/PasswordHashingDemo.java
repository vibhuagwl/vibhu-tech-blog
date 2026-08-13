package com.vibhu.crypto.password;

import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Passwords must be hashed (Argon2id / bcrypt), never encrypted for storage.
 * Encryption is reversible — password storage must not be.
 */
@Component
public class PasswordHashingDemo {

  private final PasswordEncoder argon2 =
      Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
  private final PasswordEncoder bcrypt = new BCryptPasswordEncoder(12);

  public String hashArgon2(String rawPassword) {
    return argon2.encode(rawPassword);
  }

  public boolean matchesArgon2(String rawPassword, String hash) {
    return argon2.matches(rawPassword, hash);
  }

  public String hashBcrypt(String rawPassword) {
    return bcrypt.encode(rawPassword);
  }

  public boolean matchesBcrypt(String rawPassword, String hash) {
    return bcrypt.matches(rawPassword, hash);
  }
}
