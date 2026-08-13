package com.vibhu.security.jwt.config;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security")
public class JwtProperties {

    private final Jwt jwt = new Jwt();
    private final Cors cors = new Cors();
    private final Login login = new Login();
    private final RateLimit rateLimit = new RateLimit();

    public Jwt getJwt() {
        return jwt;
    }

    public Cors getCors() {
        return cors;
    }

    public Login getLogin() {
        return login;
    }

    public RateLimit getRateLimit() {
        return rateLimit;
    }

    public static class Jwt {
        private String issuer = "spring-jwt-auth-demo";
        private String audience = "spring-jwt-auth-api";
        private Duration accessTokenExpiration = Duration.ofMinutes(15);
        private Duration refreshTokenExpiration = Duration.ofDays(7);
        private Duration clockSkew = Duration.ofSeconds(30);
        /** HMAC secret from env JWT_SECRET — never commit a production value. */
        private String secret = "";
        /** Previous HMAC for verification during key rotation. */
        private String previousSecret = "";
        /** env | aws */
        private String secretSource = "env";
        private String awsRegion = "us-east-1";
        private String awsSecretId = "";

        public String getIssuer() {
            return issuer;
        }

        public void setIssuer(String issuer) {
            this.issuer = issuer;
        }

        public String getAudience() {
            return audience;
        }

        public void setAudience(String audience) {
            this.audience = audience;
        }

        public Duration getAccessTokenExpiration() {
            return accessTokenExpiration;
        }

        public void setAccessTokenExpiration(Duration accessTokenExpiration) {
            this.accessTokenExpiration = accessTokenExpiration;
        }

        public Duration getRefreshTokenExpiration() {
            return refreshTokenExpiration;
        }

        public void setRefreshTokenExpiration(Duration refreshTokenExpiration) {
            this.refreshTokenExpiration = refreshTokenExpiration;
        }

        public Duration getClockSkew() {
            return clockSkew;
        }

        public void setClockSkew(Duration clockSkew) {
            this.clockSkew = clockSkew;
        }

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public String getPreviousSecret() {
            return previousSecret;
        }

        public void setPreviousSecret(String previousSecret) {
            this.previousSecret = previousSecret;
        }

        public String getSecretSource() {
            return secretSource;
        }

        public void setSecretSource(String secretSource) {
            this.secretSource = secretSource;
        }

        public String getAwsRegion() {
            return awsRegion;
        }

        public void setAwsRegion(String awsRegion) {
            this.awsRegion = awsRegion;
        }

        public String getAwsSecretId() {
            return awsSecretId;
        }

        public void setAwsSecretId(String awsSecretId) {
            this.awsSecretId = awsSecretId;
        }
    }

    public static class Cors {
        private List<String> allowedOrigins = new ArrayList<>();

        public List<String> getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(List<String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }

    public static class Login {
        private int maxAttempts = 5;
        private Duration lockDuration = Duration.ofMinutes(15);

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public Duration getLockDuration() {
            return lockDuration;
        }

        public void setLockDuration(Duration lockDuration) {
            this.lockDuration = lockDuration;
        }
    }

    public static class RateLimit {
        private int authRequestsPerMinute = 20;

        public int getAuthRequestsPerMinute() {
            return authRequestsPerMinute;
        }

        public void setAuthRequestsPerMinute(int authRequestsPerMinute) {
            this.authRequestsPerMinute = authRequestsPerMinute;
        }
    }
}
