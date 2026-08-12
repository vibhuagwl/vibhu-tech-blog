package com.vibhu.lock.common;

public final class KafkaTopics {
    public static final String TRANSACTION_STARTED = "lock.transaction.started";
    public static final String LOCK_ACQUIRED = "lock.acquired";
    public static final String TRANSACTION_PREPARED = "lock.transaction.prepared";
    public static final String TRANSACTION_COMMITTED = "lock.transaction.committed";
    public static final String TRANSACTION_ROLLED_BACK = "lock.transaction.rolled-back";
    public static final String LOCK_RELEASED = "lock.released";

    private KafkaTopics() {
    }
}
