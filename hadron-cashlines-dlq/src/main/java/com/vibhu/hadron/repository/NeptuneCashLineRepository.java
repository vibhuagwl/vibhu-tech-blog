package com.vibhu.hadron.repository;

import com.vibhu.hadron.entity.NeptuneCashLineEntity;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NeptuneCashLineRepository extends JpaRepository<NeptuneCashLineEntity, Long> {

  @Query(
      """
      SELECT n FROM NeptuneCashLineEntity n
       WHERE n.updatedAt > :updatedAt
          OR (n.updatedAt = :updatedAt AND n.id > :id)
       ORDER BY n.updatedAt ASC, n.id ASC
      """)
  List<NeptuneCashLineEntity> findAfterCursor(
      @Param("updatedAt") Instant updatedAt, @Param("id") Long id, Pageable pageable);
}
