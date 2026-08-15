package com.vibhu.bloom.service;

import com.vibhu.bloom.cache.InMemoryUserCache;
import com.vibhu.bloom.user.UserEntity;
import com.vibhu.bloom.user.UserRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cache-penetration-safe user lookup:
 *
 * <pre>
 *   Bloom miss  → 404 (never touch Redis/DB)
 *   Bloom maybe → Redis → DB
 * </pre>
 *
 * False positives only cost an extra Redis/DB check — never invent a user.
 */
@Service
public class UserService {

  private final BloomFilterService bloom;
  private final InMemoryUserCache cache;
  private final UserRepository users;
  private final Counter dbQueries;
  private final Counter bloomBlocked;
  private final Counter found;
  private final Counter notFound;

  public UserService(
      BloomFilterService bloom,
      InMemoryUserCache cache,
      UserRepository users,
      MeterRegistry registry) {
    this.bloom = bloom;
    this.cache = cache;
    this.users = users;
    this.dbQueries = registry.counter("user.db.queries");
    this.bloomBlocked = registry.counter("user.bloom.blocked");
    this.found = registry.counter("user.found");
    this.notFound = registry.counter("user.not_found");
  }

  @Transactional(readOnly = true)
  public Optional<UserEntity> findUser(String userId) {
    if (!bloom.mightContain(userId)) {
      bloomBlocked.increment();
      notFound.increment();
      return Optional.empty();
    }

    Optional<UserEntity> cached = cache.get(userId);
    if (cached.isPresent()) {
      found.increment();
      return cached;
    }

    dbQueries.increment();
    Optional<UserEntity> fromDb = users.findById(userId);
    if (fromDb.isPresent()) {
      cache.put(fromDb.get());
      found.increment();
      return fromDb;
    }
    // False positive path: bloom said maybe, DB says no.
    notFound.increment();
    return Optional.empty();
  }

  @Transactional
  public UserEntity createUser(String id, String displayName, String email) {
    if (users.existsById(id)) {
      throw new IllegalStateException("user already exists: " + id);
    }
    UserEntity saved = users.save(new UserEntity(id, displayName, email));
    bloom.addUserId(saved.getId());
    cache.put(saved);
    return saved;
  }

  /** Lab helper: bypass bloom to count raw DB cost of penetration attacks. */
  @Transactional(readOnly = true)
  public Optional<UserEntity> findUserBypassingBloom(String userId) {
    Optional<UserEntity> cached = cache.get(userId);
    if (cached.isPresent()) {
      return cached;
    }
    dbQueries.increment();
    return users
        .findById(userId)
        .map(
            u -> {
              cache.put(u);
              return u;
            });
  }
}
