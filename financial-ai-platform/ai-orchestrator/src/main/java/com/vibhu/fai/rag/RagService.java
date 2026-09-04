package com.vibhu.fai.rag;

import com.vibhu.fai.common.rag.PolicyMarkdownLoader;
import com.vibhu.fai.common.rag.RagPipeline;
import com.vibhu.fai.common.rag.RetrievedChunk;
import com.vibhu.fai.obs.AiMetrics;
import io.micrometer.core.instrument.Timer;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RagService {

    private final RagPipeline pipeline = new RagPipeline();
    private final AiMetrics metrics;

    public RagService(AiMetrics metrics) {
        this.metrics = metrics;
    }

  @PostConstruct
  void ingestBundledPolicies() {
      int chunks = pipeline.ingestAll(PolicyMarkdownLoader.loadClasspath());
      metrics.ingestChunks(chunks);
  }

  public List<Map<String, String>> search(
      String query, String tenantId, String documentType, String jurisdiction) {
      Timer.Sample sample = metrics.startRag();
      try {
          List<RetrievedChunk> hits = pipeline.retrieve(query, tenantId, documentType, jurisdiction, 3);
          metrics.ragHits(hits.size());
          return hits.stream()
                  .map(this::toMap)
                  .toList();
      } finally {
          metrics.stopRag(sample);
      }
  }

    public RagPipeline pipeline() {
        return pipeline;
    }

    private Map<String, String> toMap(RetrievedChunk chunk) {
        Map<String, String> row = new LinkedHashMap<>();
        row.put("policyId", chunk.policyId());
        row.put("chunkId", chunk.chunkId());
        row.put("text", chunk.text());
        row.put("version", chunk.version());
        row.put("score", String.valueOf(chunk.score()));
        return row;
  }
}
