package com.vibhu.msp.common;

import jakarta.validation.constraints.NotBlank;

public record IdempotencyKey(@NotBlank String value) {
  public static IdempotencyKey of(String value) {
    return new IdempotencyKey(value);
  }
}
