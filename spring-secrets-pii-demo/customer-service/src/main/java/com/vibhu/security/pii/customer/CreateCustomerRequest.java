package com.vibhu.security.pii.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCustomerRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp = "\\d{3}-\\d{2}-\\d{4}") String ssn,
        @NotBlank @Pattern(regexp = "\\d{4}") String panLast4
) {
}
