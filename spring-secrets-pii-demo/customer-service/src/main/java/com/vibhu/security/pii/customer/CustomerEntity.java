package com.vibhu.security.pii.customer;

import com.vibhu.security.pii.crypto.AesGcmAttributeConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "customers")
public class CustomerEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, length = 120)
  private String fullName;

  @Convert(converter = AesGcmAttributeConverter.class)
  @Column(nullable = false, length = 512)
  private String emailEncrypted;

  @Convert(converter = AesGcmAttributeConverter.class)
  @Column(nullable = false, length = 512)
  private String ssnEncrypted;

  @Column(name = "pan_last4", nullable = false, length = 4)
  private String panLast4;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  public UUID getId() {
    return id;
  }

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public String getEmailEncrypted() {
    return emailEncrypted;
  }

  public void setEmailEncrypted(String emailEncrypted) {
    this.emailEncrypted = emailEncrypted;
  }

  public String getSsnEncrypted() {
    return ssnEncrypted;
  }

  public void setSsnEncrypted(String ssnEncrypted) {
    this.ssnEncrypted = ssnEncrypted;
  }

  public String getPanLast4() {
    return panLast4;
  }

  public void setPanLast4(String panLast4) {
    this.panLast4 = panLast4;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
