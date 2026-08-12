package com.vibhu.lock.transaction;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vibhu.lock.common.IdempotencyConflictException;
import com.vibhu.lock.common.TransferResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IdempotencyService {
  private static final String IN_FLIGHT = "{\"transactionId\":\"IN_FLIGHT\",\"status\":\"IN_FLIGHT\"}";

  private final IdempotencyKeyRepository repository;
  private final ObjectMapper objectMapper;

  public IdempotencyService(IdempotencyKeyRepository repository, ObjectMapper objectMapper) {
    this.repository = repository;
    this.objectMapper = objectMapper;
  }

  /**
   * Claims the idempotency key under a unique constraint.
   * Returns an existing completed response when the key was already processed.
   * Returns null when this caller won the claim and must execute the transfer.
   */
  @Transactional
  public TransferResponse claimOrGet(String idempotencyKey) {
    if (idempotencyKey == null || idempotencyKey.isBlank()) {
      return null;
    }
    String key = idempotencyKey.trim();
    TransferResponse existing = find(key);
    if (existing != null && !"IN_FLIGHT".equals(existing.status())) {
      return existing;
    }
    if (existing != null && "IN_FLIGHT".equals(existing.status())) {
      throw new IdempotencyConflictException("Transfer with idempotency key is already in flight: " + key);
    }
    try {
      repository.saveAndFlush(new IdempotencyKeyEntity(key, "PENDING-" + key, IN_FLIGHT));
      return null;
    } catch (DataIntegrityViolationException ex) {
      TransferResponse raced = find(key);
      if (raced != null && !"IN_FLIGHT".equals(raced.status())) {
        return raced;
      }
      throw new IdempotencyConflictException("Transfer with idempotency key is already in flight: " + key);
    }
  }

  @Transactional(readOnly = true)
  public TransferResponse find(String idempotencyKey) {
    if (idempotencyKey == null || idempotencyKey.isBlank()) {
      return null;
    }
    return repository.findById(idempotencyKey.trim())
        .map(IdempotencyKeyEntity::getResponseJson)
        .map(this::read)
        .orElse(null);
  }

  @Transactional
  public void store(String idempotencyKey, TransferResponse response) {
    if (idempotencyKey == null || idempotencyKey.isBlank()) {
      return;
    }
    String key = idempotencyKey.trim();
    IdempotencyKeyEntity entity = repository.findById(key).orElse(null);
    if (entity == null) {
      try {
        repository.save(new IdempotencyKeyEntity(key, response.transactionId(), write(response)));
      } catch (DataIntegrityViolationException ignored) {
        // first-writer wins
      }
      return;
    }
    entity.setTransactionId(response.transactionId());
    entity.setResponseJson(write(response));
    repository.save(entity);
  }

  private TransferResponse read(String json) {
    try {
      return objectMapper.readValue(json, TransferResponse.class);
    } catch (JsonProcessingException ex) {
      throw new IllegalStateException("Failed to deserialize idempotency response", ex);
    }
  }

  private String write(TransferResponse response) {
    try {
      return objectMapper.writeValueAsString(response);
    } catch (JsonProcessingException ex) {
      throw new IllegalStateException("Failed to serialize idempotency response", ex);
    }
  }
}
