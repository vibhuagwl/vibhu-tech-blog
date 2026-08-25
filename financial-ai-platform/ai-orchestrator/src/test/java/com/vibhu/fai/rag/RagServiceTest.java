package com.vibhu.fai.rag;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class RagServiceTest {

  @Autowired RagService rag;

  @Test
  void tenantFilteredPolicySearch() {
    List<Map<String, String>> hits = rag.search("AC04 account closed", "TENANT-1", "POLICY", "IN");
    assertThat(hits).isNotEmpty();
    assertThat(hits.getFirst().get("policyId")).isNotBlank();
  }

  @Test
  void cosineSimilarForRelatedPhrases() {
    float[] a = InMemoryFinancialVectorStore.embed("payment failed");
    float[] b = InMemoryFinancialVectorStore.embed("payment failed bank");
    float[] c = InMemoryFinancialVectorStore.embed("zzzz unrelated qqqq");
    assertThat(InMemoryFinancialVectorStore.cosine(a, b))
        .isGreaterThan(InMemoryFinancialVectorStore.cosine(a, c));
  }
}
