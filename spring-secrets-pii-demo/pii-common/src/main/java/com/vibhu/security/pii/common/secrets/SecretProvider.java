package com.vibhu.security.pii.common.secrets;

public interface SecretProvider {

    String require(String key);

    String optional(String key, String defaultValue);
}
