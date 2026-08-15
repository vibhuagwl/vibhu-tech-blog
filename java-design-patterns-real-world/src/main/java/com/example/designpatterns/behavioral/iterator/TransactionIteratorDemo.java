package com.example.designpatterns.behavioral.iterator;

import java.util.Iterator;
import java.util.List;

/**
 * PATTERN: Iterator
 *
 * <p>PROBLEM (without this pattern) - Statement export reaches into TransactionRepository's
 * internal ArrayList. - Switching storage to paged DB cursors breaks every foreach over .items. -
 * Clients know too much about how history is stored.
 *
 * <p>HOW THIS PATTERN SOLVES IT - TransactionRepository implements Iterable and exposes iterator().
 * - Enhanced-for traverses without leaking the backing list. - Storage can change to lazy pages
 * while the traversal API stays stable.
 *
 * <p>WHEN TO IMPLEMENT - Clients must traverse a collection without knowing its internal structure
 * (tree, pages, lazy fetch). - You need a uniform traversal API across different storage shapes.
 *
 * <p>JAVA IMPLEMENTATION RULES 1. Prefer java.util.Iterator / Iterable — implement {@code
 * iterator()} rather than inventing custom cursors when possible. 2. Fail-fast vs weak-consistency:
 * document concurrent modification behavior. 3. Keep iterator state outside the collection
 * elements; do not expose internal arrays. 4. For large datasets, support lazy/pageable iteration —
 * do not load everything in the constructor. 5. Implement {@code remove()} only if supported;
 * otherwise throw UnsupportedOperationException.
 *
 * <p>DO NOT USE WHEN - A simple enhanced-for over an already-materialized List is enough.
 */
public class TransactionIteratorDemo {
  public record Transaction(String id, int amount) {}

  public static final class TransactionRepository implements Iterable<Transaction> {
    private final List<Transaction> items;

    public TransactionRepository(List<Transaction> items) {
      this.items = List.copyOf(items);
    }

    public Iterator<Transaction> iterator() {
      return items.iterator();
    }
  }

  public static void run() {
    System.out.println("=== Iterator — TransactionIteratorDemo ===");
    System.out.println(
        "PROBLEM: Clients dig into TransactionRepository's internal list to walk history, coupling"
            + " statement export to a specific storage shape.");
    System.out.println(
        "SOLUTION: Iterable TransactionRepository exposes iterator() so clients traverse with"
            + " enhanced-for without knowing whether data lives in a list, pages, or a cursor.");
    System.out.println("STEP 1: Load transactions into TransactionRepository");
    var repo =
        new TransactionRepository(
            List.of(
                new Transaction("tx-1", 100),
                new Transaction("tx-2", 250),
                new Transaction("tx-3", 75)));
    System.out.println("STEP 2: Obtain Iterator without exposing internal list");
    System.out.println("STEP 3: Traverse with enhanced-for (uses iterator() under the hood)");
    var lines = new java.util.ArrayList<String>();
    for (Transaction tx : repo) {
      lines.add(tx.id() + "=" + tx.amount());
    }
    System.out.println("  Visited: " + lines);
  }

  public static void main(String[] args) {
    run();
  }
}
