package com.vibhu.hadron.repository;

import com.vibhu.hadron.domain.DlqStatus;
import com.vibhu.hadron.entity.DeadLetterMessageEntity;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeadLetterMessageRepository extends JpaRepository<DeadLetterMessageEntity, Long> {

  Optional<DeadLetterMessageEntity> findByEventId(String eventId);

  Optional<DeadLetterMessageEntity> findByTopicAndPartitionNoAndOffsetNo(
      String topic, int partitionNo, long offsetNo);

  List<DeadLetterMessageEntity> findByCashLineIdOrderByCreatedAtAsc(String cashLineId);

  List<DeadLetterMessageEntity> findByStatusInOrderByCreatedAtAsc(Collection<DlqStatus> statuses);

  boolean existsByCashLineIdAndStatusInAndIdNot(
      String cashLineId, Collection<DlqStatus> statuses, Long id);

  @Query(
      """
      SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END
      FROM DeadLetterMessageEntity d
      WHERE d.cashLineId = :cashLineId
        AND d.status IN :open
      """)
  boolean hasOpenFailure(@Param("cashLineId") String cashLineId, @Param("open") Collection<DlqStatus> open);

  @Modifying
  @Query(
      """
      UPDATE DeadLetterMessageEntity d
         SET d.status = :toStatus,
             d.replayActor = :actor,
             d.updatedAt = :now,
             d.version = d.version + 1
       WHERE d.id = :id
         AND d.status IN :fromStatuses
         AND d.version = :version
      """)
  int claimForReplay(
      @Param("id") Long id,
      @Param("fromStatuses") Collection<DlqStatus> fromStatuses,
      @Param("toStatus") DlqStatus toStatus,
      @Param("actor") String actor,
      @Param("version") int version,
      @Param("now") Instant now);

  @Modifying
  @Query("DELETE FROM DeadLetterMessageEntity d WHERE d.status IN :statuses AND d.createdAt < :cutoff")
  int deleteExpired(@Param("statuses") Collection<DlqStatus> statuses, @Param("cutoff") Instant cutoff);
}
