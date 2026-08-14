package com.vibhu.multitenant.tenant;

import com.vibhu.multitenant.common.DatabaseStrategy;
import com.vibhu.multitenant.common.TenantStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenants")
public class TenantEntity {

  @Id private UUID id;

  @Column(nullable = false, unique = true, length = 64)
  private String slug;

  @Column(nullable = false, length = 128)
  private String name;

  @Column(nullable = false, length = 32)
  private String plan;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private TenantStatus status;

  @Enumerated(EnumType.STRING)
  @Column(name = "database_strategy", nullable = false, length = 32)
  private DatabaseStrategy databaseStrategy;

  @Column(name = "database_name", length = 128)
  private String databaseName;

  @Column(name = "schema_name", length = 128)
  private String schemaName;

  @Column(nullable = false, length = 32)
  private String region = "us-east-1";

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getSlug() {
    return slug;
  }

  public void setSlug(String slug) {
    this.slug = slug;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getPlan() {
    return plan;
  }

  public void setPlan(String plan) {
    this.plan = plan;
  }

  public TenantStatus getStatus() {
    return status;
  }

  public void setStatus(TenantStatus status) {
    this.status = status;
  }

  public DatabaseStrategy getDatabaseStrategy() {
    return databaseStrategy;
  }

  public void setDatabaseStrategy(DatabaseStrategy databaseStrategy) {
    this.databaseStrategy = databaseStrategy;
  }

  public String getDatabaseName() {
    return databaseName;
  }

  public void setDatabaseName(String databaseName) {
    this.databaseName = databaseName;
  }

  public String getSchemaName() {
    return schemaName;
  }

  public void setSchemaName(String schemaName) {
    this.schemaName = schemaName;
  }

  public String getRegion() {
    return region;
  }

  public void setRegion(String region) {
    this.region = region;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
