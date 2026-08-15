package com.vibhu.security.jwt.security;

import com.vibhu.security.jwt.config.JwtProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

/**
 * In-process fetch from AWS Secrets Manager. Activate profile {@code aws-secrets}.
 *
 * <p>Secret JSON expected: {@code {"hmac":"...at least 32 bytes..."}} or a raw string of 32+ bytes.
 *
 * <p>In most ECS/EKS setups it is simpler (and better for rotation via task restart) to inject
 * {@code JWT_SECRET} as an environment variable from Secrets Manager and keep {@code secret-source:
 * env}. Use this bean only when the JVM must pull the secret itself (for example, rotating without
 * a redeploy).
 */
@Component
@Profile("aws-secrets")
@ConditionalOnProperty(name = "security.jwt.secret-source", havingValue = "aws")
public class AwsSecretsManagerJwtSecretProvider implements JwtSecretProvider {

  private final byte[] current;
  private final byte[] previous;

  public AwsSecretsManagerJwtSecretProvider(JwtProperties properties) {
    JwtProperties.Jwt jwt = properties.getJwt();
    try (SecretsManagerClient client =
        SecretsManagerClient.builder().region(Region.of(jwt.getAwsRegion())).build()) {
      GetSecretValueResponse response =
          client.getSecretValue(
              GetSecretValueRequest.builder().secretId(jwt.getAwsSecretId()).build());
      this.current =
          EnvironmentJwtSecretProvider.requireHmac(
              parseHmac(response.secretString()), "AWS Secrets Manager hmac");
    }
    String prev = jwt.getPreviousSecret();
    this.previous =
        (prev == null || prev.isBlank())
            ? null
            : EnvironmentJwtSecretProvider.requireHmac(prev, "JWT_PREVIOUS_SECRET");
  }

  static String parseHmac(String secretString) {
    if (secretString == null || secretString.isBlank()) {
      throw new IllegalStateException("AWS secret is empty");
    }
    String trimmed = secretString.trim();
    if (trimmed.startsWith("{") && trimmed.contains("\"hmac\"")) {
      int key = trimmed.indexOf("\"hmac\"");
      int colon = trimmed.indexOf(':', key);
      int firstQuote = trimmed.indexOf('"', colon + 1);
      int secondQuote = trimmed.indexOf('"', firstQuote + 1);
      if (firstQuote > 0 && secondQuote > firstQuote) {
        return trimmed.substring(firstQuote + 1, secondQuote);
      }
    }
    return trimmed;
  }

  @Override
  public byte[] currentHmacSecret() {
    return current;
  }

  @Override
  public byte[] previousHmacSecret() {
    return previous;
  }
}
