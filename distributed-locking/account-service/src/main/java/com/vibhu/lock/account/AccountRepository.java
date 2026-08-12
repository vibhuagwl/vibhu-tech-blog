package com.vibhu.lock.account;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccountRepository extends JpaRepository<AccountEntity, String> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select a from AccountEntity a where a.id = :id")
  Optional<AccountEntity> findByIdForUpdate(@Param("id") String id);
}
