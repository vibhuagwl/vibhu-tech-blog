package com.vibhu.security.pii.secrets;

/**
 * Abstraction over env / K8s secret mount / AWS Secrets Manager / Vault.
 * Production: inject via sidecar or CSI driver; never commit values to git.
 */
public interface SecretProvider {

    String require(String key);

    String optional(String key, String defaultValue);
}
