package com.vibhu.fai.rag;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class RagServiceTest {

  @Autowired RagService rag;

  @Test
  void tenantFilteredPolicySearch() {
    List<Map<String, String>> hits = rag.search("AC04 account closed", "TENANT-1", "POLICY", "IN");
    assertThat(hits).isNotEmpty();
    assertThat(hits.getFirst().get("policyId")).isNotBlank();
      assertThat(hits.stream()
              .anyMatch(h -> "POL-PAYMENT-004".equals(h.get("policyId")))).isTrue();
  }

  @Test
  void unknownTenantGetsNoChunks() {
      assertThat(rag.search("AC04 account closed", "TENANT-UNKNOWN", "POLICY", "IN")).isEmpty();
  }

    @Test
    void ingestCreatedMultipleChunks() {
        assertThat(rag.pipeline()
                .chunkCount()).isGreaterThanOrEqualTo(5);
  }
}
