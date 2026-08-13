package com.vibhu.hadron.domain;

public enum DlqStatus {
  FAILED,
  READY_FOR_REPLAY,
  REPLAYING,
  REPLAYED,
  REPLAY_FAILED,
  RESOLVED,
  IGNORED
}
