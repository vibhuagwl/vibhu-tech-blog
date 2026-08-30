package com.example.flashsale.flash.infrastructure.redis;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InventoryLuaScriptTest {

    @Test
    void loadsGateScriptFromClasspath() {
        InventoryLuaScript scripts = new InventoryLuaScript();
        assertThat(scripts.inventoryGate()
                .getScriptAsString()).contains("DECRBY");
        assertThat(scripts.rateLimit()
                .getScriptAsString()).contains("INCR");
        assertThat(scripts.unlock()
                .getScriptAsString()).contains("DEL");
    }
}
