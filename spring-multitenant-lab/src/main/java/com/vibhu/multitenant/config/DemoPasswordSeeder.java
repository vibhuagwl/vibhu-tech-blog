package com.vibhu.multitenant.config;

import com.vibhu.multitenant.user.UserEntity;
import com.vibhu.multitenant.user.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Ensures demo users accept password "password" regardless of seed hash drift. */
@Component
public class DemoPasswordSeeder implements ApplicationRunner {

  private final UserRepository users;
  private final PasswordEncoder encoder;

  public DemoPasswordSeeder(UserRepository users, PasswordEncoder encoder) {
    this.users = users;
    this.encoder = encoder;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    for (UserEntity user : users.findAll()) {
      user.setPasswordHash(encoder.encode("password"));
      users.save(user);
    }
  }
}
