package com.vibhu.lock.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LockValueTest {
    @Test
    void parsesAndEncodesOwnerTokenAndFence() {
        LockValue value = LockValue.parse("9d0f7a37-59d5-4022-a4e1-52afc9dbdd26:42");

        assertThat(value.ownerToken()).isEqualTo("9d0f7a37-59d5-4022-a4e1-52afc9dbdd26");
        assertThat(value.fencingToken()).isEqualTo(42);
        assertThat(value.encode()).isEqualTo("9d0f7a37-59d5-4022-a4e1-52afc9dbdd26:42");
        assertThat(value.matchesOwner("9d0f7a37-59d5-4022-a4e1-52afc9dbdd26")).isTrue();
    }

    @Test
    void rejectsMalformedValues() {
        assertThatThrownBy(() -> LockValue.parse("missing-fence"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> LockValue.parse("owner:not-a-long"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
