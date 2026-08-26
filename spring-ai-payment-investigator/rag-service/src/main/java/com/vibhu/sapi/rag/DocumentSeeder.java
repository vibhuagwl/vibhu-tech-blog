package com.vibhu.sapi.rag;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

@Configuration
public class DocumentSeeder {

  @Bean
  CommandLineRunner seedDocuments(VectorStore vectorStore) {
    return args -> {
      PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
      Resource[] resources = resolver.getResources("classpath:docs/*.md");
      List<Document> docs = new ArrayList<>();
      for (Resource resource : resources) {
        String text = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String filename = resource.getFilename() == null ? "doc" : resource.getFilename();
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("source", filename);
        metadata.put("category", "policy");
        if (text.contains("BEN-001")) {
          metadata.put("errorCode", "BEN-001");
        }
        docs.add(new Document(text, metadata));
      }
      if (!docs.isEmpty()) {
        vectorStore.add(docs);
      }
    };
  }
}
