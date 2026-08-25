package com.vibhu.fai.rag;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class RagService {

  private final InMemoryFinancialVectorStore store = new InMemoryFinancialVectorStore();

  @PostConstruct
  void seedPolicies() {
    add(
        "POL-REVERSAL-001",
        "Reversals above INR 100000 require dual approval and fraud screening before execution.",
        "POLICY",
        "IN");
    add(
        "POL-PAYMENT-004",
        "Bank code AC04 means account closed. Do not retry to same account. Update beneficiary KYC details.",
        "POLICY",
        "IN");
    add(
        "POL-KYC-010",
        "KYC holds block outbound payments until documents verified by compliance.",
        "POLICY",
        "IN");
    add(
        "POL-RISK-020",
        "Portfolio concentration above 40% in a single name is HIGH risk and must be disclosed to the trader.",
        "POLICY",
        "IN");
  }

  private void add(String policyId, String text, String type, String jurisdiction) {
    Map<String, Object> meta = new HashMap<>();
    meta.put("tenantId", "TENANT-1");
    meta.put("documentType", type);
    meta.put("jurisdiction", jurisdiction);
    meta.put("policyId", policyId);
    meta.put("version", "2026.08");
    store.add(
        new InMemoryFinancialVectorStore.Entry(
            policyId, text, InMemoryFinancialVectorStore.embed(text), meta));
  }

  public List<Map<String, String>> search(
      String query, String tenantId, String documentType, String jurisdiction) {
    float[] q = InMemoryFinancialVectorStore.embed(query);
    return store
        .search(
            q,
            3,
            e ->
                tenantId.equals(e.metadata().get("tenantId"))
                    && documentType.equals(e.metadata().get("documentType"))
                    && jurisdiction.equals(e.metadata().get("jurisdiction")))
        .stream()
        .map(
            e ->
                Map.of(
                    "policyId", String.valueOf(e.metadata().get("policyId")),
                    "text", e.text(),
                    "version", String.valueOf(e.metadata().get("version"))))
        .toList();
  }

  public InMemoryFinancialVectorStore store() {
    return store;
  }
}
