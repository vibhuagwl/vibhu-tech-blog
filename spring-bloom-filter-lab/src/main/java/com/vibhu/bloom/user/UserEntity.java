package com.vibhu.bloom.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "users")
public class UserEntity {

  @Id
  @Column(length = 64)
  private String id;

  @Column(name = "display_name", nullable = false, length = 128)
  private String displayName;

  @Column(nullable = false, length = 256)
  private String email;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  protected UserEntity() {}

  public UserEntity(String id, String displayName, String email) {
    this.id = id;
    this.displayName = displayName;
    this.email = email;
    this.createdAt = Instant.now();
  }

  public String getId() {
    return id;
  }

  public String getDisplayName() {
    return displayName;
  }

  public String getEmail() {
    return email;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
