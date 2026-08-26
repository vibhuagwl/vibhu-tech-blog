package com.vibhu.sapi.rag;

import java.util.List;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

@Service
public class RagService {

  private final VectorStore vectorStore;

  public RagService(VectorStore vectorStore) {
    this.vectorStore = vectorStore;
  }

  public List<Document> search(String query, int topK) {
    return vectorStore.similaritySearch(
        SearchRequest.builder().query(query).topK(topK).similarityThreshold(0.0).build());
  }
}
