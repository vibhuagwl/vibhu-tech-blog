package com.vibhu.sapi.rag;

import java.util.List;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

@Service
public class RagService {

  private final VectorStore vectorStore;
  private final RagProperties properties;
  private final DocumentSeeder documentSeeder;

  public RagService(VectorStore vectorStore, RagProperties properties, DocumentSeeder documentSeeder) {
    this.vectorStore = vectorStore;
    this.properties = properties;
    this.documentSeeder = documentSeeder;
  }

  public List<Document> search(String query) {
    return search(query, properties.topK());
  }

  public List<Document> search(String query, int topK) {
    if (query == null || query.isBlank() || topK <= 0) {
      return List.of();
    }
    return vectorStore.similaritySearch(
        SearchRequest.builder()
            .query(query)
            .topK(topK)
            .similarityThreshold(properties.similarityThreshold())
            .build());
  }

  public int indexedDocumentCount() {
    return documentSeeder.indexedCount();
  }
}
