package com.vibhu.connectionpool;

/** Explicit lifecycle states for a pooled connection wrapper. Illegal transitions throw. */
public enum ConnectionState {
  CREATED,
  IDLE,
  BORROWED,
  VALIDATING,
  /** Marked while borrowed when maxLifetime exceeded; closed on release. */
  RETIRE_ON_RETURN,
  INVALID,
  CLOSING,
  CLOSED
}
