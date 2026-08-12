package com.example.designpatterns.behavioral.iterator;

import java.util.Iterator;
import java.util.List;

public class TransactionIteratorDemo {
    public record Transaction(String id, int amount) {}
    public static final class TransactionRepository implements Iterable<Transaction> {
        private final List<Transaction> items;
        public TransactionRepository(List<Transaction> items){ this.items = List.copyOf(items); }
        public Iterator<Transaction> iterator(){ return items.iterator(); }
    }
}
