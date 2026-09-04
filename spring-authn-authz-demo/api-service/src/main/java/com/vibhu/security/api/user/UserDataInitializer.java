package com.vibhu.security.api.user;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
public class UserDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDataInitializer(UserRepository userRepository, RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        RoleEntity userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> {
                    RoleEntity r = new RoleEntity();
                    r.setName("ROLE_USER");
                    return roleRepository.save(r);
                });
        RoleEntity adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> {
                    RoleEntity r = new RoleEntity();
                    r.setName("ROLE_ADMIN");
                    return roleRepository.save(r);
                });

        if (userRepository.findByUsername("alice")
                .isEmpty()) {
            UserEntity alice = new UserEntity();
            alice.setUsername("alice");
            alice.setPassword(passwordEncoder.encode("password"));
            alice.setEnabled(true);
            alice.setRoles(Set.of(userRole));
            userRepository.save(alice);
        }
        if (userRepository.findByUsername("admin")
                .isEmpty()) {
            UserEntity admin = new UserEntity();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("password"));
            admin.setEnabled(true);
            admin.setRoles(Set.of(userRole, adminRole));
            userRepository.save(admin);
        }
    }
}
