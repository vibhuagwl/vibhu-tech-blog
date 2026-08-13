package com.vibhu.crypto.entity;

import com.vibhu.crypto.crypto.EncryptedStringConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "customers")
public class Customer {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String name;

  /** Randomized AES-GCM — not searchable. */
  @Convert(converter = EncryptedStringConverter.class)
  @Column(name = "account_number_enc", length = 1024)
  private String accountNumber;

  /** HMAC lookup for equality search (trade-off: same plaintext → same digest). */
  @Column(name = "account_number_lookup", length = 128, unique = true)
  private String accountNumberLookup;

  @Convert(converter = EncryptedStringConverter.class)
  @Column(name = "pan_enc", length = 1024)
  private String pan;

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getAccountNumber() {
    return accountNumber;
  }

  public void setAccountNumber(String accountNumber) {
    this.accountNumber = accountNumber;
  }

  public String getAccountNumberLookup() {
    return accountNumberLookup;
  }

  public void setAccountNumberLookup(String accountNumberLookup) {
    this.accountNumberLookup = accountNumberLookup;
  }

  public String getPan() {
    return pan;
  }

  public void setPan(String pan) {
    this.pan = pan;
  }
}
