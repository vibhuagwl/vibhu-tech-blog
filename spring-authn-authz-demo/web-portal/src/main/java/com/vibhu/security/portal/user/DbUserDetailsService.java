package com.vibhu.security.portal.user;

import java.util.stream.Collectors;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Authentication bridge: username → UserDetails (password hash + ROLE_* authorities).
 * DaoAuthenticationProvider calls this during form login.
 */
@Service
public class DbUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public DbUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEntity entity = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return User.builder()
                .username(entity.getUsername())
                .password(entity.getPassword())
                .disabled(!entity.isEnabled())
                .authorities(entity.getRoles().stream()
                        .map(RoleEntity::getName)
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toSet()))
                .build();
    }
}
