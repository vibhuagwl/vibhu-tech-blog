package com.vibhu.security.jwt.repository;

import com.vibhu.security.jwt.entity.RefreshToken;
import com.vibhu.security.jwt.entity.User;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

  Optional<RefreshToken> findByTokenHash(String tokenHash);

  List<RefreshToken> findByUserAndRevokedAtIsNull(User user);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      "update RefreshToken t set t.revokedAt = :now where t.familyId = :familyId and t.revokedAt is null")
  int revokeFamily(@Param("familyId") String familyId, @Param("now") Instant now);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      "update RefreshToken t set t.revokedAt = :now where t.user = :user and t.revokedAt is null")
  int revokeAllForUser(@Param("user") User user, @Param("now") Instant now);
}
