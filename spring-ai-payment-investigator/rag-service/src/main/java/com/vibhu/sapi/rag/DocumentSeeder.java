package com.vibhu.sapi.rag;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

/**
 * Loads payment policy markdown into the {@link VectorStore}.
 *
 * <p>Not invoked by controllers or tools. Spring Boot calls {@link #seed()} once after the
 * application context is ready, from {@link RagAutoConfiguration#ragDocumentSeedRunner(DocumentSeeder)}.
 * That configuration is imported by {@code PaymentInvestigatorApplication}.
 *
 * <p>After seed, retrieval happens via {@link RagService#search(String, int)} from
 * {@code ContextEngineeringService} and {@code InvestigationTools#searchPaymentPolicy}.
 */
@Component
public class DocumentSeeder {

  private static final Logger log = LoggerFactory.getLogger(DocumentSeeder.class);

  private final VectorStore vectorStore;
  private final RagProperties properties;
  private final AtomicInteger indexedCount = new AtomicInteger();

  public DocumentSeeder(VectorStore vectorStore, RagProperties properties) {
    this.vectorStore = vectorStore;
    this.properties = properties;
  }

  public void seed() throws IOException {
    Resource[] resources =
        new PathMatchingResourcePatternResolver().getResources(properties.docsPattern());
    List<Document> docs = new ArrayList<>();
    for (Resource resource : resources) {
      if (!resource.exists() || !resource.isReadable()) {
        log.warn("Skipping unreadable RAG resource {}", resource);
        continue;
      }
      docs.add(toDocument(resource));
    }

    if (docs.isEmpty()) {
      String message = "No RAG documents found at " + properties.docsPattern();
      if (properties.failOnEmpty()) {
        throw new IllegalStateException(message);
      }
      log.warn(message);
      return;
    }

    vectorStore.add(docs);
    indexedCount.set(docs.size());
    log.info(
        "RAG seed complete: indexed {} policy document(s) from {}",
        docs.size(),
        properties.docsPattern());
  }

  public int indexedCount() {
    return indexedCount.get();
  }

  private static Document toDocument(Resource resource) throws IOException {
    String filename = resource.getFilename() == null ? "doc" : resource.getFilename();
    String text;
    try (InputStream in = resource.getInputStream()) {
      text = new String(in.readAllBytes(), StandardCharsets.UTF_8);
    }
    Map<String, Object> metadata = new LinkedHashMap<>();
    metadata.put("source", filename);
    metadata.put("category", "policy");
    if (text.contains("BEN-001")) {
      metadata.put("errorCode", "BEN-001");
    }
    log.debug("Prepared RAG document source={} bytes={}", filename, text.length());
    return new Document(text, metadata);
  }
}
