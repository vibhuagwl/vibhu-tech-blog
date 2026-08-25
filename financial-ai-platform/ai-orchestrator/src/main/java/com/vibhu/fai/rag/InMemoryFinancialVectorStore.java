package com.vibhu.fai.rag;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Predicate;

/**
 * ============================================================
 * INTERVIEW NOTES — Embeddings / Vector Search
 * ============================================================
 * Embedding converts text → dense vector.
 * Similar meaning ⇒ vectors are close (cosine similarity).
 * Vector search ≈ nearest-neighbour search over embeddings.
 * Always filter by tenantId to prevent cross-tenant RAG leakage.
 * Memory: RAG for docs/policies — never for live balances/prices.
 * ============================================================
 */
public class InMemoryFinancialVectorStore {

  public record Entry(String id, String text, float[] vector, Map<String, Object> metadata) {}

  private final List<Entry> entries = new CopyOnWriteArrayList<>();

  public void add(Entry entry) {
    entries.add(entry);
  }

  public List<Entry> search(float[] query, int topK, Predicate<Entry> filter) {
    return entries.stream()
        .filter(filter)
        .map(e -> Map.entry(e, cosine(query, e.vector())))
        .sorted(Comparator.<Map.Entry<Entry, Float>>comparingDouble(Map.Entry::getValue).reversed())
        .limit(topK)
        .map(Map.Entry::getKey)
        .toList();
  }

  public List<Entry> all() {
    return List.copyOf(entries);
  }

  static float cosine(float[] a, float[] b) {
    double dot = 0, na = 0, nb = 0;
    int n = Math.min(a.length, b.length);
    for (int i = 0; i < n; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (na == 0 || nb == 0) {
      return 0f;
    }
    return (float) (dot / (Math.sqrt(na) * Math.sqrt(nb)));
  }

  /** Tiny bag-of-chars embedding for offline demos (not production quality). */
  public static float[] embed(String text) {
    float[] v = new float[32];
    String t = text.toLowerCase();
    for (int i = 0; i < t.length(); i++) {
      v[t.charAt(i) % 32] += 1f;
    }
    float norm = 0;
    for (float x : v) {
      norm += x * x;
    }
    norm = (float) Math.sqrt(norm);
    if (norm > 0) {
      for (int i = 0; i < v.length; i++) {
        v[i] /= norm;
      }
    }
    return v;
  }
}
