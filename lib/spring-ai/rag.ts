/** RAG, embeddings, vector stores. */

export const RAG_PIPELINE = `Ingest
Document → Reader → Extract → Clean → Chunk(+overlap) → Metadata → Embedding → Vector DB

Query
User Question → Query Embedding → Vector Search (top-K, filters)
  → Optional hybrid keyword → Re-rank → Context pack → LLM → Answer + Citations

FinTech docs: compliance policies, payment policies, trading rules, runbooks, product docs
NOT for: live balances, prices, P&L — those are tools/calculators`;

export const RAG_CODE = `// Ingest sketch
Document doc = new Document(text, Map.of(
    "docType", "COMPLIANCE",
    "policyId", "POL-ACH-01",
    "jurisdiction", "IN",
    "version", "2026.08"));
vectorStore.add(List.of(doc)); // embedding model applied by store/config

// Query via advisor (Spring AI 1.0+)
String answer = chatClient.prompt()
    .advisors(QuestionAnswerAdvisor.builder(vectorStore)
        .searchRequest(SearchRequest.builder().topK(5).similarityThreshold(0.75).build())
        .build())
    .user("What is the approval policy for reversals over 10 lakh?")
    .call()
    .content();

Always require citations (policyId/version). If no chunk above threshold → refuse guess.`;

export const EMBEDDINGS = `Embedding(text) → dense vector [0.12, -0.43, 0.78, ...]

Semantic similarity: "payment failed" ≈ "transaction rejected by bank"
even when tokens differ.

Metrics
  cosine similarity (common after normalization)
  dot product / Euclidean (related)

Ops
  model id + version in metadata (re-embed on upgrade)
  cost/latency of embedding at ingest + query
  dimension size affects storage/ANN index

Interview: embeddings map meaning to geometry; vector search ≈ nearest neighbors in that space.`;

export const IN_MEMORY_VS = `Mandatory lab store:
  FinancialDocument → FinancialChunk → float[] embedding → similarity top-K + metadata filter

class InMemoryFinancialVectorStore {
  record Entry(String id, String text, float[] vector, Map<String,Object> meta) {}
  final List<Entry> entries = new CopyOnWriteArrayList<>();
  void add(...) { entries.add(new Entry(...)); }
  List<Entry> search(float[] q, int k, Predicate<Entry> filter) {
    return entries.stream().filter(filter)
      .sorted(byCosineDesc(q)).limit(k).toList();
  }
}

Limits: RAM, lost on restart, no multi-pod consistency, weak ANN at scale
Migrate: Postgres+pgvector → Redis vector → OpenSearch/Elastic → dedicated VS
Choose by corpus size, SLA, ops skill, hybrid search needs`;

export const VECTORSTORE_API = `Spring AI VectorStore abstraction:
  vectorStore.add(List<Document>)
  vectorStore.similaritySearch(SearchRequest)

Document = content + metadata (+ id)
Filters on metadata (tenant, docType, jurisdiction)
topK + similarityThreshold

Production: separate collections/indexes per tenant or strict metadata filters
to prevent cross-tenant RAG leakage.`;
