package com.vibhu.security.jwt.config;

import com.vibhu.security.jwt.entity.Role;
import com.vibhu.security.jwt.entity.User;
import com.vibhu.security.jwt.repository.RoleRepository;
import com.vibhu.security.jwt.repository.UserRepository;
import java.time.Instant;
import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements ApplicationRunner {

    public static final String DEMO_PASSWORD = "StrongPassword123!";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
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
        Role userRole = roleRepository.findByName("ROLE_USER").orElseThrow();
        Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseThrow();
        if (userRepository.findByEmailIgnoreCase("user@example.com").isEmpty()) {
            User user = new User();
            user.setEmail("user@example.com");
            user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
            user.setRoles(Set.of(userRole));
            user.setCreatedAt(Instant.now());
            userRepository.save(user);
        }
        if (userRepository.findByEmailIgnoreCase("admin@example.com").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@example.com");
            admin.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
            admin.setRoles(Set.of(userRole, adminRole));
            admin.setCreatedAt(Instant.now());
            userRepository.save(admin);
        }
    }
}
