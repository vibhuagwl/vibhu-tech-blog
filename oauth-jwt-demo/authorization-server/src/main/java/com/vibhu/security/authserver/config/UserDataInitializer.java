package com.vibhu.security.authserver.config;

import com.vibhu.security.authserver.user.RoleEntity;
import com.vibhu.security.authserver.user.RoleRepository;
import com.vibhu.security.authserver.user.UserEntity;
import com.vibhu.security.authserver.user.UserRepository;
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

    public UserDataInitializer(UserRepository userRepository,
                               RoleRepository roleRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        RoleEntity userRole = roleRepository.findByName("USER").orElseThrow();
        RoleEntity adminRole = roleRepository.findByName("ADMIN").orElseThrow();
        RoleEntity paymentRole = roleRepository.findByName("PAYMENT_USER").orElseThrow();

        createIfMissing("alice", passwordEncoder.encode("password"), userRole, paymentRole);
        createIfMissing("admin", passwordEncoder.encode("password"), userRole, adminRole, paymentRole);
    }

    private void createIfMissing(String username, String hash, RoleEntity... roles) {
        if (userRepository.findByUsername(username).isPresent()) {
            return;
        }
        UserEntity user = new UserEntity();
        user.setUsername(username);
        user.setPasswordHash(hash);
        user.setEnabled(true);
        for (RoleEntity role : roles) {
            user.getRoles().add(role);
        }
        userRepository.save(user);
    }
}
