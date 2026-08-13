package com.vibhu.security.jwt.security;

import com.vibhu.security.jwt.exception.InvalidTokenException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reads {@code Authorization: Bearer}, validates the JWT, loads the user, and
 * stores authentication in {@link SecurityContextHolder}. No business logic here.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final AccessTokenDenylist denylist;
    private final RestAuthenticationEntryPoint entryPoint;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserDetailsService userDetailsService,
            AccessTokenDenylist denylist,
            RestAuthenticationEntryPoint entryPoint) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.denylist = denylist;
        this.entryPoint = entryPoint;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || header.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }
        if (!header.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String username = jwtService.extractUsername(token);
            String jti = jwtService.extractJti(token);
            if (denylist.isRevoked(jti)) {
                throw new InvalidTokenException("Access token revoked");
            }
            UserDetails user = userDetailsService.loadUserByUsername(username);
            if (!user.isEnabled() || !user.isAccountNonLocked()) {
                throw new InvalidTokenException("Account is not usable");
            }
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            filterChain.doFilter(request, response);
        } catch (InvalidTokenException ex) {
            log.debug("JWT rejected: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
            entryPoint.write(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized",
                    "Invalid or expired access token", request);
        } catch (Exception ex) {
            log.debug("JWT authentication failed: {}", ex.getClass().getSimpleName());
            SecurityContextHolder.clearContext();
            entryPoint.write(response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized",
                    "Invalid or expired access token", request);
        }
    }
}
