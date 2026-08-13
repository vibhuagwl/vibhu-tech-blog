package com.vibhu.hadron.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "poller_cursor")
public class PollerCursorEntity {

  @Id
  @Column(length = 64)
  private String id = "neptune-cashlines";

  @Column(nullable = false)
  private Instant lastUpdatedAt = Instant.EPOCH;

  @Column(nullable = false)
  private long lastId;

  @Column(nullable = false)
  private Instant updatedAt = Instant.now();

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public Instant getLastUpdatedAt() {
    return lastUpdatedAt;
  }

  public void setLastUpdatedAt(Instant lastUpdatedAt) {
    this.lastUpdatedAt = lastUpdatedAt;
  }

  public long getLastId() {
    return lastId;
  }

  public void setLastId(long lastId) {
    this.lastId = lastId;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
