package com.vibhu.connectionpool;

import com.vibhu.connectionpool.exception.ConnectionCreationException;

@FunctionalInterface
public interface ConnectionFactory {
  Connection create() throws ConnectionCreationException;
}
