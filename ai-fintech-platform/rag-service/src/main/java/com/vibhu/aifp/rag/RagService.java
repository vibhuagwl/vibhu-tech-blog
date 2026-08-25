package com.vibhu.aifp.rag;

import java.util.List;
import java.util.Map;
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

  public List<Document> retrieve(String query, Map<String, String> metadataFilters) {
    SearchRequest.Builder builder = SearchRequest.builder().query(query).topK(5).similarityThreshold(0.1);
    if (metadataFilters != null && !metadataFilters.isEmpty()) {
      StringBuilder filter = new StringBuilder();
      metadataFilters.forEach(
          (key, value) -> {
            if (!filter.isEmpty()) {
              filter.append(" AND ");
            }
            filter.append(key).append(" == '").append(value).append("'");
          });
      builder.filterExpression(filter.toString());
    }
    return vectorStore.similaritySearch(builder.build());
  }
}
