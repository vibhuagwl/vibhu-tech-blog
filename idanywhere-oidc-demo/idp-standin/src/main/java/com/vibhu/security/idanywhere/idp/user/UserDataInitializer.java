package com.vibhu.security.idanywhere.idp.user;

import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class UserDataInitializer implements ApplicationRunner {

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final PasswordEncoder passwordEncoder;

  public UserDataInitializer(
      UserRepository userRepository,
      RoleRepository roleRepository,
      PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    RoleEntity user = role("ROLE_USER");
    RoleEntity admin = role("ROLE_ADMIN");
    create("alice", Set.of(user));
    create("admin", Set.of(user, admin));
  }

  private RoleEntity role(String name) {
    return roleRepository
        .findByName(name)
        .orElseGet(
            () -> {
              RoleEntity r = new RoleEntity();
              r.setName(name);
              return roleRepository.save(r);
            });
  }

  private void create(String username, Set<RoleEntity> roles) {
    if (userRepository.findByUsername(username).isPresent()) {
      return;
    }
    UserEntity u = new UserEntity();
    u.setUsername(username);
    u.setPasswordHash(passwordEncoder.encode("password"));
    u.setEnabled(true);
    u.setRoles(roles);
    userRepository.save(u);
  }
}
