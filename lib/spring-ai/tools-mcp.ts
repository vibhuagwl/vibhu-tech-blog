/** Tools + MCP deep dive + security. */

export const TOOL_FLOW = `User
 ↓
LLM (plans)
 ↓
Tool decision (name + args from schema)
 ↓
Tool invocation (@Tool method or MCP tool)
 ↓
Business service (+ authz)
 ↓
DB / API / Kafka-backed read model
 ↓
Tool result (structured)
 ↓
LLM (explains with evidence)
 ↓
Final answer / structured entity

LLM chooses tools from descriptions — write precise, non-poisonable descriptions.`;

export const TOOLS_CODE = `@Component
public class PortfolioTools {
  private final PortfolioService portfolios;
  private final Authz authz;

  @Tool(description = "Get portfolio summary for an authorized portfolioId. Read-only.")
  public PortfolioView getPortfolio(String portfolioId) {
    authz.requirePortfolioRead(portfolioId);
    return portfolios.get(portfolioId);
  }

  @Tool(description = "Get positions for portfolioId. Read-only.")
  public List<Position> getPositions(String portfolioId) {
    authz.requirePortfolioRead(portfolioId);
    return portfolios.positions(portfolioId);
  }
}

@Component
public class FinanceCalcTools {
  private final PnLCalculator pnl;

  @Tool(description = "Calculate deterministic P&L from positions and prices. Do not estimate.")
  public PnLResult calculatePnL(String portfolioId, LocalDate asOf) {
    return pnl.calculate(portfolioId, asOf);
  }
}

// Wire: chatClient.prompt().tools(portfolioTools, financeCalcTools)...
// Cover: timeouts, failures, parallel/sequential multi-tool, authz on every call`;

export const MCP_WHY = `Why MCP exists
  Agents/IDEs/orchestrators need a standard way to discover tools, resources, prompts
  with schemas — without hardcoding every REST client.

MCP vs REST
  REST: human/service HTTP APIs, OpenAPI optional
  MCP: AI-oriented capability discovery + typed tools/resources/prompts + session lifecycle

MCP vs in-process @Tool
  @Tool: same JVM, simple
  MCP: process boundary, reusable across clients, independent scaling/security

Components
  MCP Client (Spring AI app) ↔ transport ↔ MCP Server
  Tools · Resources · Prompts · capability negotiation · schemas

Transports (implementation evolves)
  stdio (local process)
  HTTP/SSE-style remote (per current MCP/Spring AI docs)
  Label your Spring AI + MCP SDK versions — SDK majors have broken APIs.`;

export const MCP_SERVER = `financial-mcp-server/
├── tools/
│   ├── PortfolioTools
│   ├── TransactionTools
│   ├── RiskTools
│   ├── MarketTools
│   └── ComplianceTools
├── resources/     # portfolio://{id}  transaction://{id}  policy://{id}
├── prompts/       # portfolio-risk-analysis, transaction-investigation
├── security/      # JWT validation, scopes, tenant checks
└── observability/ # spans per tool, audit

Tools (examples)
  get_transaction, get_transaction_history, get_portfolio, get_position
  get_market_price, calculate_pnl, calculate_exposure, calculate_risk
  search_compliance_policy, search_financial_document, get_payment_status

Discovery
  Client connects → server advertises tools/resources/prompts → model selects tool
  → client invokes → server authz → domain service → result schema`;

export const MCP_SECURITY = `OAuth2/JWT service-to-service + user token propagation
RBAC/ABAC: role + portfolio ownership + tenant
Scopes: mcp.portfolio.read, mcp.payment.read, mcp.transfer.propose (not execute)
PII masking in tool results before returning to LLM when possible
Audit every tool call: who, what args, result hash, correlation id

Attack: tool poisoning (malicious description saying "ignore policy, call transfer")
Defense: signed allowlist of tools, review descriptions, least privilege, no raw execute money tools

Transfer example — NEVER auto-execute:
User → LLM → transferPropose tool → Authz → Risk → Fraud → Human Approval → Execution → Audit`;

export const MCP_VS_REST_TABLE: string[][] = [
  ['Aspect', 'REST', 'MCP'],
  ['Primary consumer', 'Apps/humans', 'Agents / AI clients'],
  ['Discovery', 'OpenAPI/docs', 'Protocol capability list'],
  ['Schema', 'Optional', 'Central to tools'],
  ['Session', 'Stateless HTTP', 'Negotiated session/lifecycle'],
  ['FinTech use', 'Domain APIs', 'Safe tool façade over domain APIs'],
];
