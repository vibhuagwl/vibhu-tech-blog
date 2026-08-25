package com.vibhu.ratelimit.store;

public record FixedWindowState(long windowStartMs, int count) {}
