package com.example.designpatterns.behavioral.iterator;

import java.util.Iterator;
import java.util.List;

/**
 * PATTERN: Iterator
 *
 * WHEN TO IMPLEMENT
 * - Clients must traverse a collection without knowing its internal structure (tree, pages, lazy fetch).
 * - You need a uniform traversal API across different storage shapes.
 *
 * JAVA IMPLEMENTATION RULES
 * 1. Prefer java.util.Iterator / Iterable — implement {@code iterator()} rather than inventing custom cursors when possible.
 * 2. Fail-fast vs weak-consistency: document concurrent modification behavior.
 * 3. Keep iterator state outside the collection elements; do not expose internal arrays.
 * 4. For large datasets, support lazy/pageable iteration — do not load everything in the constructor.
 * 5. Implement {@code remove()} only if supported; otherwise throw UnsupportedOperationException.
 *
 * DO NOT USE WHEN
 * - A simple enhanced-for over an already-materialized List is enough.
 */
public class TransactionIteratorDemo {
    public record Transaction(String id, int amount) {}
    public static final class TransactionRepository implements Iterable<Transaction> {
        private final List<Transaction> items;
        public TransactionRepository(List<Transaction> items){ this.items = List.copyOf(items); }
        public Iterator<Transaction> iterator(){ return items.iterator(); }
    }
}
