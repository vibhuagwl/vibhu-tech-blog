package com.vibhu.sapi.rag;

import java.util.List;
import java.util.Locale;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.stereotype.Component;

@Component
public class HashEmbeddingModel implements EmbeddingModel {

  private static final int DIMENSIONS = 128;

  @Override
  public EmbeddingResponse call(EmbeddingRequest request) {
    List<Embedding> embeddings =
        request.getInstructions().stream().map(text -> new Embedding(embed(text), 0)).toList();
    return new EmbeddingResponse(embeddings);
  }

  @Override
  public float[] embed(Document document) {
    return embed(document.getText());
  }

  @Override
  public float[] embed(String text) {
    float[] vector = new float[DIMENSIONS];
    if (text == null || text.isBlank()) {
      return vector;
    }
    String[] tokens =
        text.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s]", " ").split("\\s+");
    for (String token : tokens) {
      if (token.isBlank()) {
        continue;
      }
      int idx = Math.floorMod(token.hashCode(), DIMENSIONS);
      vector[idx] += 1.0f;
    }
    normalize(vector);
    return vector;
  }

  @Override
  public int dimensions() {
    return DIMENSIONS;
  }

  private static void normalize(float[] vector) {
    double sum = 0;
    for (float v : vector) {
      sum += v * v;
    }
    if (sum == 0) {
      return;
    }
    double norm = Math.sqrt(sum);
    for (int i = 0; i < vector.length; i++) {
      vector[i] = (float) (vector[i] / norm);
    }
  }
}
