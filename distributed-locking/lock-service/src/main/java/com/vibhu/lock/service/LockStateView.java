package com.vibhu.lock.service;

import java.util.Map;
import java.util.Set;

public record LockStateView(
    String lockKey,
    LockValue exclusive,
    Map<String, LockValue> sharedOwners,
    Set<String> waitingOwners,
    Set<String> holderTransactions) {}
