package com.vibhu.connectionpool;

@FunctionalInterface
public interface ConnectionValidator {
  /**
   * Returns true if the connection can safely be handed to a borrower.
   * Must not throw — treat exceptions as invalid.
   */
  boolean isValid(Connection connection);
}
