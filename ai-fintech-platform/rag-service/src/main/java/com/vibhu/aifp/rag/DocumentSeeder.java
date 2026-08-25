package com.vibhu.aifp.rag;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

@Component
public class DocumentSeeder {

  private final VectorStore vectorStore;

  public DocumentSeeder(VectorStore vectorStore) {
    this.vectorStore = vectorStore;
  }

  @PostConstruct
  void seedDocs() throws IOException {
    PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
    Resource[] resources = resolver.getResources("classpath:docs/*.md");
    for (Resource resource : resources) {
      String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
      String id = resource.getFilename() == null ? "doc" : resource.getFilename().replace(".md", "");
      vectorStore.add(
          List.of(
              new Document(
                  id,
                  content,
                  Map.of(
                      "docId", id,
                      "source", resource.getFilename(),
                      "category", categoryFor(id)))));
    }
  }

  private static String categoryFor(String id) {
    if (id.contains("retry")) {
      return "retry-policy";
    }
    if (id.contains("runbook")) {
      return "runbook";
    }
    if (id.contains("error")) {
      return "error-codes";
    }
    if (id.contains("refund")) {
      return "refund";
    }
    if (id.contains("fraud")) {
      return "fraud";
    }
    return "policy";
  }
}
