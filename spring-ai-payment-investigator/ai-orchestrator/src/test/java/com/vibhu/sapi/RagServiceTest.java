package com.vibhu.sapi;

import static org.assertj.core.api.Assertions.assertThat;

import com.vibhu.sapi.orchestrator.PaymentInvestigatorApplication;
import com.vibhu.sapi.rag.RagService;
import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = PaymentInvestigatorApplication.class)
class RagServiceTest {

  @Autowired RagService ragService;

  @Test
  void retrievesBen001Policy() {
    var docs = ragService.search("BEN-001 beneficiary invalid retry policy", 5);
    assertThat(docs).isNotEmpty();
    assertThat(docs.stream().map(Document::getText).anyMatch(t -> t.contains("BEN-001"))).isTrue();
  }
}
