package com.vibhu.msp.eventsourcing;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Event-sourced aggregate with snapshot support. */
public final class BankAccountAggregate {

  public record Snapshot(String accountId, double balance, long version) {}

  private final String accountId;
  private double balance;
  private long version;
  private final List<DomainEvent> uncommitted = new ArrayList<>();

  private BankAccountAggregate(String accountId, double balance, long version) {
    this.accountId = accountId;
    this.balance = balance;
    this.version = version;
  }

  public static BankAccountAggregate create(String accountId) {
    return new BankAccountAggregate(accountId, 0, 0);
  }

  public static BankAccountAggregate fromHistory(List<DomainEvent> events) {
    if (events.isEmpty()) {
      throw new IllegalArgumentException("No events");
    }
    BankAccountAggregate agg = new BankAccountAggregate(events.getFirst().aggregateId(), 0, 0);
    for (DomainEvent event : events) {
      agg.apply(event);
      agg.version = event.version();
    }
    return agg;
  }

  public static BankAccountAggregate fromSnapshot(Snapshot snapshot, List<DomainEvent> after) {
    BankAccountAggregate agg = new BankAccountAggregate(snapshot.accountId(), snapshot.balance(), snapshot.version());
    for (DomainEvent event : after) {
      agg.apply(event);
      agg.version = event.version();
    }
    return agg;
  }

  public void deposit(double amount) {
    if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
    long nextVersion = version + uncommitted.size() + 1;
    DomainEvent event = new DomainEvent(accountId, "Deposited", String.valueOf(amount), Instant.now(), nextVersion);
    apply(event);
    uncommitted.add(event);
  }

  private void apply(DomainEvent event) {
    if ("Deposited".equals(event.eventType())) {
      balance += Double.parseDouble(event.payload());
    } else if ("Withdrawn".equals(event.eventType())) {
      balance -= Double.parseDouble(event.payload());
    }
  }

  public Snapshot snapshot() {
    return new Snapshot(accountId, balance, version);
  }

  public List<DomainEvent> pullUncommitted() {
    List<DomainEvent> copy = List.copyOf(uncommitted);
    uncommitted.clear();
    return copy;
  }

  public double balance() { return balance; }
  public long version() { return version; }
}
