import type {Incident, InterviewQ, ScenarioQ} from './types';
import {DESIGN} from './parts-design';

export const TRICK_QS: InterviewQ[] = [
  {
    "id": "trick-0",
    "topic": "RestClient vs RestTemplate",
    "level": "staff",
    "question": "Trick: \"RestClient vs RestTemplate\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying RestClient vs RestTemplate — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For RestClient vs RestTemplate, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does RestClient vs RestTemplate break at scale?",
      "Production metric for RestClient vs RestTemplate?"
    ],
    "trick": "Retry all HTTP errors including 400.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-1",
    "topic": "WebClient vs RestClient",
    "level": "junior",
    "question": "Staff trap on WebClient vs RestClient: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on WebClient vs RestClient — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix WebClient vs RestClient with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for WebClient vs RestClient?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "gRPC is always better than REST for browser clients."
  },
  {
    "id": "trick-2",
    "topic": "OpenFeign defaults",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"OpenFeign defaults\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for OpenFeign defaults.",
    "answer2m": "Staff answer for OpenFeign defaults: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for OpenFeign defaults?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-3",
    "topic": "gRPC vs REST",
    "level": "junior",
    "question": "Trick: \"gRPC vs REST\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying gRPC vs REST — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For gRPC vs REST, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does gRPC vs REST break at scale?",
      "Production metric for gRPC vs REST?"
    ],
    "trick": "No timeout needed for internal service calls.",
    "wrongAnswer": "Shared database is fine with microservices if teams coordinate."
  },
  {
    "id": "trick-4",
    "topic": "Kafka request-reply",
    "level": "senior",
    "question": "Staff trap on Kafka request-reply: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Kafka request-reply — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Kafka request-reply with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Kafka request-reply?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-5",
    "topic": "Sync vs async choice",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"Sync vs async choice\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Sync vs async choice.",
    "answer2m": "Staff answer for Sync vs async choice: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Sync vs async choice?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-6",
    "topic": "Timeout hierarchy",
    "level": "senior",
    "question": "Trick: \"Timeout hierarchy\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Timeout hierarchy — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Timeout hierarchy, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Timeout hierarchy break at scale?",
      "Production metric for Timeout hierarchy?"
    ],
    "trick": "Feign default retry is safe for POST payments.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-7",
    "topic": "Retry on POST",
    "level": "junior",
    "question": "Staff trap on Retry on POST: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Retry on POST — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Retry on POST with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Retry on POST?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "DNS never causes intermittent 503 in Kubernetes."
  },
  {
    "id": "trick-8",
    "topic": "Circuit breaker half-open",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Circuit breaker half-open\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Circuit breaker half-open.",
    "answer2m": "Staff answer for Circuit breaker half-open: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Circuit breaker half-open?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-9",
    "topic": "Bulkhead isolation",
    "level": "junior",
    "question": "Trick: \"Bulkhead isolation\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Bulkhead isolation — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Bulkhead isolation, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Bulkhead isolation break at scale?",
      "Production metric for Bulkhead isolation?"
    ],
    "trick": "Service mesh removes need for application timeouts.",
    "wrongAnswer": "Contract tests replace integration tests entirely."
  },
  {
    "id": "trick-10",
    "topic": "Idempotency-Key header",
    "level": "staff",
    "question": "Staff trap on Idempotency-Key header: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Idempotency-Key header — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Idempotency-Key header with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Idempotency-Key header?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-11",
    "topic": "Transactional outbox",
    "level": "junior",
    "question": "Compare junior vs staff answer for \"Transactional outbox\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Transactional outbox.",
    "answer2m": "Staff answer for Transactional outbox: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Transactional outbox?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Consumer lag zero required for all Kafka topics."
  },
  {
    "id": "trick-12",
    "topic": "Saga orchestration",
    "level": "senior",
    "question": "Trick: \"Saga orchestration\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Saga orchestration — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Saga orchestration, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Saga orchestration break at scale?",
      "Production metric for Saga orchestration?"
    ],
    "trick": "503 means client should retry immediately without backoff.",
    "wrongAnswer": "mTLS terminates need for application auth."
  },
  {
    "id": "trick-13",
    "topic": "Choreography vs orchestration",
    "level": "junior",
    "question": "Staff trap on Choreography vs orchestration: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Choreography vs orchestration — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Choreography vs orchestration with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Choreography vs orchestration?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Retry all HTTP errors including 400."
  },
  {
    "id": "trick-14",
    "topic": "Service discovery Eureka",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Service discovery Eureka\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Service discovery Eureka.",
    "answer2m": "Staff answer for Service discovery Eureka: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Service discovery Eureka?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "RestTemplate is recommended for new Spring Boot 3 services."
  },
  {
    "id": "trick-15",
    "topic": "Kubernetes DNS",
    "level": "staff",
    "question": "Trick: \"Kubernetes DNS\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Kubernetes DNS — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Kubernetes DNS, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Kubernetes DNS break at scale?",
      "Production metric for Kubernetes DNS?"
    ],
    "trick": "Problem Details are optional niceties only.",
    "wrongAnswer": "Kafka gives exactly-once end-to-end by default."
  },
  {
    "id": "trick-16",
    "topic": "Spring Cloud LoadBalancer",
    "level": "senior",
    "question": "Staff trap on Spring Cloud LoadBalancer: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Spring Cloud LoadBalancer — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Spring Cloud LoadBalancer with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Spring Cloud LoadBalancer?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "No timeout needed for internal service calls."
  },
  {
    "id": "trick-17",
    "topic": "API Gateway routing",
    "level": "junior",
    "question": "Compare junior vs staff answer for \"API Gateway routing\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for API Gateway routing.",
    "answer2m": "Staff answer for API Gateway routing: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for API Gateway routing?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Circuit breaker replaces timeout configuration."
  },
  {
    "id": "trick-18",
    "topic": "BFF aggregation",
    "level": "senior",
    "question": "Trick: \"BFF aggregation\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying BFF aggregation — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For BFF aggregation, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does BFF aggregation break at scale?",
      "Production metric for BFF aggregation?"
    ],
    "trick": "Consumer lag zero required for all Kafka topics.",
    "wrongAnswer": "Forward user JWT to every downstream without audience check."
  },
  {
    "id": "trick-19",
    "topic": "mTLS vs TLS",
    "level": "junior",
    "question": "Staff trap on mTLS vs TLS: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on mTLS vs TLS — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix mTLS vs TLS with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for mTLS vs TLS?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Feign default retry is safe for POST payments."
  },
  {
    "id": "trick-20",
    "topic": "JWT propagation",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"JWT propagation\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for JWT propagation.",
    "answer2m": "Staff answer for JWT propagation: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for JWT propagation?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-21",
    "topic": "OAuth2 token exchange",
    "level": "junior",
    "question": "Trick: \"OAuth2 token exchange\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying OAuth2 token exchange — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For OAuth2 token exchange, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does OAuth2 token exchange break at scale?",
      "Production metric for OAuth2 token exchange?"
    ],
    "trick": "RestTemplate is recommended for new Spring Boot 3 services.",
    "wrongAnswer": "gRPC is always better than REST for browser clients."
  },
  {
    "id": "trick-22",
    "topic": "Problem Details RFC 9457",
    "level": "senior",
    "question": "Staff trap on Problem Details RFC 9457: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Problem Details RFC 9457 — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Problem Details RFC 9457 with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Problem Details RFC 9457?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-23",
    "topic": "Pact contract testing",
    "level": "junior",
    "question": "Compare junior vs staff answer for \"Pact contract testing\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Pact contract testing.",
    "answer2m": "Staff answer for Pact contract testing: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Pact contract testing?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Shared database is fine with microservices if teams coordinate."
  },
  {
    "id": "trick-24",
    "topic": "Spring Cloud Contract",
    "level": "senior",
    "question": "Trick: \"Spring Cloud Contract\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Spring Cloud Contract — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Spring Cloud Contract, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Spring Cloud Contract break at scale?",
      "Production metric for Spring Cloud Contract?"
    ],
    "trick": "Circuit breaker replaces timeout configuration.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-25",
    "topic": "Schema Registry compatibility",
    "level": "staff",
    "question": "Staff trap on Schema Registry compatibility: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Schema Registry compatibility — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Schema Registry compatibility with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Schema Registry compatibility?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-26",
    "topic": "Little's Law sizing",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Little's Law sizing\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Little's Law sizing.",
    "answer2m": "Staff answer for Little's Law sizing: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Little's Law sizing?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-27",
    "topic": "Connection pool exhaustion",
    "level": "junior",
    "question": "Trick: \"Connection pool exhaustion\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Connection pool exhaustion — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Connection pool exhaustion, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Connection pool exhaustion break at scale?",
      "Production metric for Connection pool exhaustion?"
    ],
    "trick": "WebClient is always non-blocking so pool size does not matter.",
    "wrongAnswer": "DNS never causes intermittent 503 in Kubernetes."
  },
  {
    "id": "trick-28",
    "topic": "DNS caching stale",
    "level": "senior",
    "question": "Staff trap on DNS caching stale: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on DNS caching stale — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix DNS caching stale with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for DNS caching stale?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-29",
    "topic": "HTTP/2 multiplexing",
    "level": "junior",
    "question": "Compare junior vs staff answer for \"HTTP/2 multiplexing\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for HTTP/2 multiplexing.",
    "answer2m": "Staff answer for HTTP/2 multiplexing: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for HTTP/2 multiplexing?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Contract tests replace integration tests entirely."
  },
  {
    "id": "trick-30",
    "topic": "Keep-alive pitfalls",
    "level": "staff",
    "question": "Trick: \"Keep-alive pitfalls\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Keep-alive pitfalls — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Keep-alive pitfalls, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Keep-alive pitfalls break at scale?",
      "Production metric for Keep-alive pitfalls?"
    ],
    "trick": "Shared database is fine with microservices if teams coordinate.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-31",
    "topic": "Graceful shutdown",
    "level": "junior",
    "question": "Staff trap on Graceful shutdown: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Graceful shutdown — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Graceful shutdown with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Graceful shutdown?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Consumer lag zero required for all Kafka topics."
  },
  {
    "id": "trick-32",
    "topic": "Health check vs readiness",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Health check vs readiness\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Health check vs readiness.",
    "answer2m": "Staff answer for Health check vs readiness: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Health check vs readiness?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "mTLS terminates need for application auth."
  },
  {
    "id": "trick-33",
    "topic": "Distributed tracing propagation",
    "level": "junior",
    "question": "Trick: \"Distributed tracing propagation\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Distributed tracing propagation — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Distributed tracing propagation, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Distributed tracing propagation break at scale?",
      "Production metric for Distributed tracing propagation?"
    ],
    "trick": "Connection pool max 10 is always enough.",
    "wrongAnswer": "Retry all HTTP errors including 400."
  },
  {
    "id": "trick-34",
    "topic": "Kafka header trace",
    "level": "senior",
    "question": "Staff trap on Kafka header trace: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Kafka header trace — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Kafka header trace with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Kafka header trace?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "RestTemplate is recommended for new Spring Boot 3 services."
  },
  {
    "id": "trick-35",
    "topic": "429 Retry-After",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"429 Retry-After\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for 429 Retry-After.",
    "answer2m": "Staff answer for 429 Retry-After: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for 429 Retry-After?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Kafka gives exactly-once end-to-end by default."
  },
  {
    "id": "trick-36",
    "topic": "503 vs 504 gateway",
    "level": "senior",
    "question": "Trick: \"503 vs 504 gateway\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying 503 vs 504 gateway — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For 503 vs 504 gateway, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does 503 vs 504 gateway break at scale?",
      "Production metric for 503 vs 504 gateway?"
    ],
    "trick": "Contract tests replace integration tests entirely.",
    "wrongAnswer": "No timeout needed for internal service calls."
  },
  {
    "id": "trick-37",
    "topic": "Feign retry + CB order",
    "level": "junior",
    "question": "Staff trap on Feign retry + CB order: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Feign retry + CB order — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Feign retry + CB order with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Feign retry + CB order?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Circuit breaker replaces timeout configuration."
  },
  {
    "id": "trick-38",
    "topic": "Resilience4j config",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Resilience4j config\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Resilience4j config.",
    "answer2m": "Staff answer for Resilience4j config: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Resilience4j config?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Forward user JWT to every downstream without audience check."
  },
  {
    "id": "trick-39",
    "topic": "Virtual threads Java 21",
    "level": "junior",
    "question": "Trick: \"Virtual threads Java 21\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Virtual threads Java 21 — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Virtual threads Java 21, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Virtual threads Java 21 break at scale?",
      "Production metric for Virtual threads Java 21?"
    ],
    "trick": "mTLS terminates need for application auth.",
    "wrongAnswer": "Feign default retry is safe for POST payments."
  },
  {
    "id": "trick-40",
    "topic": "Structured concurrency",
    "level": "staff",
    "question": "Staff trap on Structured concurrency: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Structured concurrency — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Structured concurrency with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Structured concurrency?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-41",
    "topic": "Event ordering partitions",
    "level": "junior",
    "question": "Compare junior vs staff answer for \"Event ordering partitions\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Event ordering partitions.",
    "answer2m": "Staff answer for Event ordering partitions: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Event ordering partitions?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "gRPC is always better than REST for browser clients."
  },
  {
    "id": "trick-42",
    "topic": "Exactly-once myth",
    "level": "senior",
    "question": "Trick: \"Exactly-once myth\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Exactly-once myth — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Exactly-once myth, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Exactly-once myth break at scale?",
      "Production metric for Exactly-once myth?"
    ],
    "trick": "Kafka gives exactly-once end-to-end by default.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-43",
    "topic": "Dual write problem",
    "level": "junior",
    "question": "Staff trap on Dual write problem: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Dual write problem — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Dual write problem with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Dual write problem?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Shared database is fine with microservices if teams coordinate."
  },
  {
    "id": "trick-44",
    "topic": "CQRS read model sync",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"CQRS read model sync\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for CQRS read model sync.",
    "answer2m": "Staff answer for CQRS read model sync: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for CQRS read model sync?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-45",
    "topic": "GraphQL N+1 downstream",
    "level": "staff",
    "question": "Trick: \"GraphQL N+1 downstream\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying GraphQL N+1 downstream — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For GraphQL N+1 downstream, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does GraphQL N+1 downstream break at scale?",
      "Production metric for GraphQL N+1 downstream?"
    ],
    "trick": "Forward user JWT to every downstream without audience check.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-46",
    "topic": "Service mesh sidecar latency",
    "level": "senior",
    "question": "Staff trap on Service mesh sidecar latency: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Service mesh sidecar latency — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Service mesh sidecar latency with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Service mesh sidecar latency?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-47",
    "topic": "Istio mTLS STRICT",
    "level": "junior",
    "question": "Compare junior vs staff answer for \"Istio mTLS STRICT\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Istio mTLS STRICT.",
    "answer2m": "Staff answer for Istio mTLS STRICT: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Istio mTLS STRICT?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "DNS never causes intermittent 503 in Kubernetes."
  },
  {
    "id": "trick-48",
    "topic": "Canary traffic split",
    "level": "senior",
    "question": "Trick: \"Canary traffic split\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Canary traffic split — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Canary traffic split, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Canary traffic split break at scale?",
      "Production metric for Canary traffic split?"
    ],
    "trick": "gRPC is always better than REST for browser clients.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-49",
    "topic": "Feature flag comm path",
    "level": "junior",
    "question": "Staff trap on Feature flag comm path: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Feature flag comm path — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Feature flag comm path with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Feature flag comm path?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Contract tests replace integration tests entirely."
  },
  {
    "id": "trick-50",
    "topic": "Webhook delivery retry",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"Webhook delivery retry\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Webhook delivery retry.",
    "answer2m": "Staff answer for Webhook delivery retry: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Webhook delivery retry?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-51",
    "topic": "SSE vs WebSocket vs polling",
    "level": "junior",
    "question": "Trick: \"SSE vs WebSocket vs polling\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying SSE vs WebSocket vs polling — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For SSE vs WebSocket vs polling, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does SSE vs WebSocket vs polling break at scale?",
      "Production metric for SSE vs WebSocket vs polling?"
    ],
    "trick": "Async everywhere improves user-facing latency.",
    "wrongAnswer": "Consumer lag zero required for all Kafka topics."
  },
  {
    "id": "trick-52",
    "topic": "Long polling anti-pattern",
    "level": "senior",
    "question": "Staff trap on Long polling anti-pattern: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Long polling anti-pattern — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Long polling anti-pattern with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Long polling anti-pattern?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "mTLS terminates need for application auth."
  },
  {
    "id": "trick-53",
    "topic": "Pagination cursor vs offset",
    "level": "junior",
    "question": "Compare junior vs staff answer for \"Pagination cursor vs offset\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Pagination cursor vs offset.",
    "answer2m": "Staff answer for Pagination cursor vs offset: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Pagination cursor vs offset?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Retry all HTTP errors including 400."
  },
  {
    "id": "trick-54",
    "topic": "Rate limiter client vs server",
    "level": "senior",
    "question": "Trick: \"Rate limiter client vs server\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Rate limiter client vs server — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Rate limiter client vs server, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Rate limiter client vs server break at scale?",
      "Production metric for Rate limiter client vs server?"
    ],
    "trick": "DNS never causes intermittent 503 in Kubernetes.",
    "wrongAnswer": "RestTemplate is recommended for new Spring Boot 3 services."
  },
  {
    "id": "trick-55",
    "topic": "Hedged requests",
    "level": "staff",
    "question": "Staff trap on Hedged requests: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Hedged requests — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Hedged requests with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Hedged requests?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Kafka gives exactly-once end-to-end by default."
  },
  {
    "id": "trick-56",
    "topic": "Backup request pattern",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Backup request pattern\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Backup request pattern.",
    "answer2m": "Staff answer for Backup request pattern: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Backup request pattern?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "No timeout needed for internal service calls."
  },
  {
    "id": "trick-57",
    "topic": "Anti-corruption layer",
    "level": "junior",
    "question": "Trick: \"Anti-corruption layer\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Anti-corruption layer — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Anti-corruption layer, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Anti-corruption layer break at scale?",
      "Production metric for Anti-corruption layer?"
    ],
    "trick": "Virtual threads eliminate all blocking concerns.",
    "wrongAnswer": "Circuit breaker replaces timeout configuration."
  },
  {
    "id": "trick-58",
    "topic": "Strangler fig migration",
    "level": "senior",
    "question": "Staff trap on Strangler fig migration: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Strangler fig migration — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Strangler fig migration with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Strangler fig migration?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Forward user JWT to every downstream without audience check."
  },
  {
    "id": "trick-59",
    "topic": "Database per service",
    "level": "junior",
    "question": "Compare junior vs staff answer for \"Database per service\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Database per service.",
    "answer2m": "Staff answer for Database per service: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Database per service?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Feign default retry is safe for POST payments."
  },
  {
    "id": "trick-60",
    "topic": "Shared cache invalidation",
    "level": "staff",
    "question": "Trick: \"Shared cache invalidation\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Shared cache invalidation — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Shared cache invalidation, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Shared cache invalidation break at scale?",
      "Production metric for Shared cache invalidation?"
    ],
    "trick": "Retry all HTTP errors including 400.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-61",
    "topic": "Redis pub/sub vs Kafka",
    "level": "junior",
    "question": "Staff trap on Redis pub/sub vs Kafka: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Redis pub/sub vs Kafka — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Redis pub/sub vs Kafka with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Redis pub/sub vs Kafka?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "gRPC is always better than REST for browser clients."
  },
  {
    "id": "trick-62",
    "topic": "gRPC deadline propagation",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"gRPC deadline propagation\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for gRPC deadline propagation.",
    "answer2m": "Staff answer for gRPC deadline propagation: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for gRPC deadline propagation?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-63",
    "topic": "Protobuf schema evolution",
    "level": "junior",
    "question": "Trick: \"Protobuf schema evolution\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Protobuf schema evolution — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Protobuf schema evolution, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Protobuf schema evolution break at scale?",
      "Production metric for Protobuf schema evolution?"
    ],
    "trick": "No timeout needed for internal service calls.",
    "wrongAnswer": "Shared database is fine with microservices if teams coordinate."
  },
  {
    "id": "trick-64",
    "topic": "OpenAPI codegen drift",
    "level": "senior",
    "question": "Staff trap on OpenAPI codegen drift: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on OpenAPI codegen drift — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix OpenAPI codegen drift with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for OpenAPI codegen drift?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-65",
    "topic": "Spring 6 HttpInterface",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"Spring 6 HttpInterface\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Spring 6 HttpInterface.",
    "answer2m": "Staff answer for Spring 6 HttpInterface: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Spring 6 HttpInterface?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-66",
    "topic": "Reactive blocking call",
    "level": "senior",
    "question": "Trick: \"Reactive blocking call\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Reactive blocking call — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Reactive blocking call, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Reactive blocking call break at scale?",
      "Production metric for Reactive blocking call?"
    ],
    "trick": "Feign default retry is safe for POST payments.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-67",
    "topic": "ThreadLocal trace loss",
    "level": "junior",
    "question": "Staff trap on ThreadLocal trace loss: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on ThreadLocal trace loss — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix ThreadLocal trace loss with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for ThreadLocal trace loss?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "DNS never causes intermittent 503 in Kubernetes."
  },
  {
    "id": "trick-68",
    "topic": "Async @Async self-invocation",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Async @Async self-invocation\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Async @Async self-invocation.",
    "answer2m": "Staff answer for Async @Async self-invocation: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Async @Async self-invocation?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-69",
    "topic": "Kafka consumer rebalance",
    "level": "junior",
    "question": "Trick: \"Kafka consumer rebalance\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Kafka consumer rebalance — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Kafka consumer rebalance, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Kafka consumer rebalance break at scale?",
      "Production metric for Kafka consumer rebalance?"
    ],
    "trick": "Service mesh removes need for application timeouts.",
    "wrongAnswer": "Contract tests replace integration tests entirely."
  },
  {
    "id": "trick-70",
    "topic": "Static membership Kafka",
    "level": "staff",
    "question": "Staff trap on Static membership Kafka: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Static membership Kafka — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Static membership Kafka with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Static membership Kafka?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-71",
    "topic": "Partition key hot spot",
    "level": "junior",
    "question": "Compare junior vs staff answer for \"Partition key hot spot\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Partition key hot spot.",
    "answer2m": "Staff answer for Partition key hot spot: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Partition key hot spot?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Consumer lag zero required for all Kafka topics."
  }
];

export const RAPID_QS: InterviewQ[] = [
  {
    "id": "rapid-0",
    "topic": "RestClient",
    "level": "staff",
    "question": "Quick: one-line rule for RestClient in microservice communication?",
    "answer30s": "RestClient: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand RestClient with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "RestClient config knob?",
      "RestClient production alert?"
    ]
  },
  {
    "id": "rapid-1",
    "topic": "WebClient",
    "level": "junior",
    "question": "Quick: one-line rule for WebClient in microservice communication?",
    "answer30s": "WebClient: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand WebClient with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "WebClient config knob?",
      "WebClient production alert?"
    ]
  },
  {
    "id": "rapid-2",
    "topic": "OpenFeign",
    "level": "junior",
    "question": "Quick: one-line rule for OpenFeign in microservice communication?",
    "answer30s": "OpenFeign: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand OpenFeign with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "OpenFeign config knob?",
      "OpenFeign production alert?"
    ]
  },
  {
    "id": "rapid-3",
    "topic": "gRPC",
    "level": "senior",
    "question": "Quick: one-line rule for gRPC in microservice communication?",
    "answer30s": "gRPC: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand gRPC with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "gRPC config knob?",
      "gRPC production alert?"
    ]
  },
  {
    "id": "rapid-4",
    "topic": "GraphQL",
    "level": "junior",
    "question": "Quick: one-line rule for GraphQL in microservice communication?",
    "answer30s": "GraphQL: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand GraphQL with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "GraphQL config knob?",
      "GraphQL production alert?"
    ]
  },
  {
    "id": "rapid-5",
    "topic": "Kafka produce",
    "level": "junior",
    "question": "Quick: one-line rule for Kafka produce in microservice communication?",
    "answer30s": "Kafka produce: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Kafka produce with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Kafka produce config knob?",
      "Kafka produce production alert?"
    ]
  },
  {
    "id": "rapid-6",
    "topic": "Kafka consume",
    "level": "senior",
    "question": "Quick: one-line rule for Kafka consume in microservice communication?",
    "answer30s": "Kafka consume: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Kafka consume with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Kafka consume config knob?",
      "Kafka consume production alert?"
    ]
  },
  {
    "id": "rapid-7",
    "topic": "Outbox",
    "level": "staff",
    "question": "Quick: one-line rule for Outbox in microservice communication?",
    "answer30s": "Outbox: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Outbox with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Outbox config knob?",
      "Outbox production alert?"
    ]
  },
  {
    "id": "rapid-8",
    "topic": "Saga",
    "level": "junior",
    "question": "Quick: one-line rule for Saga in microservice communication?",
    "answer30s": "Saga: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Saga with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Saga config knob?",
      "Saga production alert?"
    ]
  },
  {
    "id": "rapid-9",
    "topic": "Timeout",
    "level": "senior",
    "question": "Quick: one-line rule for Timeout in microservice communication?",
    "answer30s": "Timeout: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Timeout with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Timeout config knob?",
      "Timeout production alert?"
    ]
  },
  {
    "id": "rapid-10",
    "topic": "Retry",
    "level": "junior",
    "question": "Quick: one-line rule for Retry in microservice communication?",
    "answer30s": "Retry: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Retry with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Retry config knob?",
      "Retry production alert?"
    ]
  },
  {
    "id": "rapid-11",
    "topic": "Circuit breaker",
    "level": "junior",
    "question": "Quick: one-line rule for Circuit breaker in microservice communication?",
    "answer30s": "Circuit breaker: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Circuit breaker with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Circuit breaker config knob?",
      "Circuit breaker production alert?"
    ]
  },
  {
    "id": "rapid-12",
    "topic": "Bulkhead",
    "level": "senior",
    "question": "Quick: one-line rule for Bulkhead in microservice communication?",
    "answer30s": "Bulkhead: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Bulkhead with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Bulkhead config knob?",
      "Bulkhead production alert?"
    ]
  },
  {
    "id": "rapid-13",
    "topic": "Rate limit",
    "level": "junior",
    "question": "Quick: one-line rule for Rate limit in microservice communication?",
    "answer30s": "Rate limit: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Rate limit with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Rate limit config knob?",
      "Rate limit production alert?"
    ]
  },
  {
    "id": "rapid-14",
    "topic": "Load balancer",
    "level": "staff",
    "question": "Quick: one-line rule for Load balancer in microservice communication?",
    "answer30s": "Load balancer: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Load balancer with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Load balancer config knob?",
      "Load balancer production alert?"
    ]
  },
  {
    "id": "rapid-15",
    "topic": "Service discovery",
    "level": "senior",
    "question": "Quick: one-line rule for Service discovery in microservice communication?",
    "answer30s": "Service discovery: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Service discovery with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Service discovery config knob?",
      "Service discovery production alert?"
    ]
  },
  {
    "id": "rapid-16",
    "topic": "API Gateway",
    "level": "junior",
    "question": "Quick: one-line rule for API Gateway in microservice communication?",
    "answer30s": "API Gateway: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand API Gateway with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "API Gateway config knob?",
      "API Gateway production alert?"
    ]
  },
  {
    "id": "rapid-17",
    "topic": "BFF",
    "level": "junior",
    "question": "Quick: one-line rule for BFF in microservice communication?",
    "answer30s": "BFF: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand BFF with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "BFF config knob?",
      "BFF production alert?"
    ]
  },
  {
    "id": "rapid-18",
    "topic": "mTLS",
    "level": "senior",
    "question": "Quick: one-line rule for mTLS in microservice communication?",
    "answer30s": "mTLS: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand mTLS with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "mTLS config knob?",
      "mTLS production alert?"
    ]
  },
  {
    "id": "rapid-19",
    "topic": "JWT",
    "level": "junior",
    "question": "Quick: one-line rule for JWT in microservice communication?",
    "answer30s": "JWT: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand JWT with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "JWT config knob?",
      "JWT production alert?"
    ]
  },
  {
    "id": "rapid-20",
    "topic": "OAuth2",
    "level": "junior",
    "question": "Quick: one-line rule for OAuth2 in microservice communication?",
    "answer30s": "OAuth2: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand OAuth2 with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "OAuth2 config knob?",
      "OAuth2 production alert?"
    ]
  },
  {
    "id": "rapid-21",
    "topic": "Problem Details",
    "level": "staff",
    "question": "Quick: one-line rule for Problem Details in microservice communication?",
    "answer30s": "Problem Details: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Problem Details with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Problem Details config knob?",
      "Problem Details production alert?"
    ]
  },
  {
    "id": "rapid-22",
    "topic": "Pact",
    "level": "junior",
    "question": "Quick: one-line rule for Pact in microservice communication?",
    "answer30s": "Pact: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Pact with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Pact config knob?",
      "Pact production alert?"
    ]
  },
  {
    "id": "rapid-23",
    "topic": "Little's Law",
    "level": "junior",
    "question": "Quick: one-line rule for Little's Law in microservice communication?",
    "answer30s": "Little's Law: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Little's Law with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Little's Law config knob?",
      "Little's Law production alert?"
    ]
  },
  {
    "id": "rapid-24",
    "topic": "Connection pool",
    "level": "senior",
    "question": "Quick: one-line rule for Connection pool in microservice communication?",
    "answer30s": "Connection pool: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Connection pool with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Connection pool config knob?",
      "Connection pool production alert?"
    ]
  },
  {
    "id": "rapid-25",
    "topic": "DNS",
    "level": "junior",
    "question": "Quick: one-line rule for DNS in microservice communication?",
    "answer30s": "DNS: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand DNS with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "DNS config knob?",
      "DNS production alert?"
    ]
  },
  {
    "id": "rapid-26",
    "topic": "Health check",
    "level": "junior",
    "question": "Quick: one-line rule for Health check in microservice communication?",
    "answer30s": "Health check: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Health check with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Health check config knob?",
      "Health check production alert?"
    ]
  },
  {
    "id": "rapid-27",
    "topic": "Readiness",
    "level": "senior",
    "question": "Quick: one-line rule for Readiness in microservice communication?",
    "answer30s": "Readiness: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Readiness with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Readiness config knob?",
      "Readiness production alert?"
    ]
  },
  {
    "id": "rapid-28",
    "topic": "Tracing",
    "level": "staff",
    "question": "Quick: one-line rule for Tracing in microservice communication?",
    "answer30s": "Tracing: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Tracing with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Tracing config knob?",
      "Tracing production alert?"
    ]
  },
  {
    "id": "rapid-29",
    "topic": "RED metrics",
    "level": "junior",
    "question": "Quick: one-line rule for RED metrics in microservice communication?",
    "answer30s": "RED metrics: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand RED metrics with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "RED metrics config knob?",
      "RED metrics production alert?"
    ]
  },
  {
    "id": "rapid-30",
    "topic": "Virtual threads",
    "level": "senior",
    "question": "Quick: one-line rule for Virtual threads in microservice communication?",
    "answer30s": "Virtual threads: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Virtual threads with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Virtual threads config knob?",
      "Virtual threads production alert?"
    ]
  },
  {
    "id": "rapid-31",
    "topic": "Idempotency",
    "level": "junior",
    "question": "Quick: one-line rule for Idempotency in microservice communication?",
    "answer30s": "Idempotency: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Idempotency with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Idempotency config knob?",
      "Idempotency production alert?"
    ]
  },
  {
    "id": "rapid-32",
    "topic": "DLQ",
    "level": "junior",
    "question": "Quick: one-line rule for DLQ in microservice communication?",
    "answer30s": "DLQ: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand DLQ with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "DLQ config knob?",
      "DLQ production alert?"
    ]
  },
  {
    "id": "rapid-33",
    "topic": "Schema Registry",
    "level": "senior",
    "question": "Quick: one-line rule for Schema Registry in microservice communication?",
    "answer30s": "Schema Registry: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Schema Registry with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Schema Registry config knob?",
      "Schema Registry production alert?"
    ]
  },
  {
    "id": "rapid-34",
    "topic": "Hedged request",
    "level": "junior",
    "question": "Quick: one-line rule for Hedged request in microservice communication?",
    "answer30s": "Hedged request: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Hedged request with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Hedged request config knob?",
      "Hedged request production alert?"
    ]
  },
  {
    "id": "rapid-35",
    "topic": "Sidecar mesh",
    "level": "staff",
    "question": "Quick: one-line rule for Sidecar mesh in microservice communication?",
    "answer30s": "Sidecar mesh: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Sidecar mesh with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Sidecar mesh config knob?",
      "Sidecar mesh production alert?"
    ]
  },
  {
    "id": "rapid-36",
    "topic": "Canary",
    "level": "senior",
    "question": "Quick: one-line rule for Canary in microservice communication?",
    "answer30s": "Canary: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Canary with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Canary config knob?",
      "Canary production alert?"
    ]
  },
  {
    "id": "rapid-37",
    "topic": "Graceful shutdown",
    "level": "junior",
    "question": "Quick: one-line rule for Graceful shutdown in microservice communication?",
    "answer30s": "Graceful shutdown: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Graceful shutdown with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Graceful shutdown config knob?",
      "Graceful shutdown production alert?"
    ]
  },
  {
    "id": "rapid-38",
    "topic": "Webhook",
    "level": "junior",
    "question": "Quick: one-line rule for Webhook in microservice communication?",
    "answer30s": "Webhook: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Webhook with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Webhook config knob?",
      "Webhook production alert?"
    ]
  },
  {
    "id": "rapid-39",
    "topic": "SSE",
    "level": "senior",
    "question": "Quick: one-line rule for SSE in microservice communication?",
    "answer30s": "SSE: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand SSE with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "SSE config knob?",
      "SSE production alert?"
    ]
  },
  {
    "id": "rapid-40",
    "topic": "Polling",
    "level": "junior",
    "question": "Quick: one-line rule for Polling in microservice communication?",
    "answer30s": "Polling: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Polling with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Polling config knob?",
      "Polling production alert?"
    ]
  },
  {
    "id": "rapid-41",
    "topic": "CQRS projection",
    "level": "junior",
    "question": "Quick: one-line rule for CQRS projection in microservice communication?",
    "answer30s": "CQRS projection: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand CQRS projection with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "CQRS projection config knob?",
      "CQRS projection production alert?"
    ]
  },
  {
    "id": "rapid-42",
    "topic": "Event notification",
    "level": "staff",
    "question": "Quick: one-line rule for Event notification in microservice communication?",
    "answer30s": "Event notification: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Event notification with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Event notification config knob?",
      "Event notification production alert?"
    ]
  },
  {
    "id": "rapid-43",
    "topic": "Strangler",
    "level": "junior",
    "question": "Quick: one-line rule for Strangler in microservice communication?",
    "answer30s": "Strangler: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Strangler with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Strangler config knob?",
      "Strangler production alert?"
    ]
  },
  {
    "id": "rapid-44",
    "topic": "Anti-corruption",
    "level": "junior",
    "question": "Quick: one-line rule for Anti-corruption in microservice communication?",
    "answer30s": "Anti-corruption: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Anti-corruption with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Anti-corruption config knob?",
      "Anti-corruption production alert?"
    ]
  },
  {
    "id": "rapid-45",
    "topic": "Feign decoder",
    "level": "senior",
    "question": "Quick: one-line rule for Feign decoder in microservice communication?",
    "answer30s": "Feign decoder: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Feign decoder with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Feign decoder config knob?",
      "Feign decoder production alert?"
    ]
  },
  {
    "id": "rapid-46",
    "topic": "Gateway filter",
    "level": "junior",
    "question": "Quick: one-line rule for Gateway filter in microservice communication?",
    "answer30s": "Gateway filter: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Gateway filter with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Gateway filter config knob?",
      "Gateway filter production alert?"
    ]
  },
  {
    "id": "rapid-47",
    "topic": "CORS",
    "level": "junior",
    "question": "Quick: one-line rule for CORS in microservice communication?",
    "answer30s": "CORS: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand CORS with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "CORS config knob?",
      "CORS production alert?"
    ]
  },
  {
    "id": "rapid-48",
    "topic": "Compression",
    "level": "senior",
    "question": "Quick: one-line rule for Compression in microservice communication?",
    "answer30s": "Compression: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Compression with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Compression config knob?",
      "Compression production alert?"
    ]
  },
  {
    "id": "rapid-49",
    "topic": "Avro",
    "level": "staff",
    "question": "Quick: one-line rule for Avro in microservice communication?",
    "answer30s": "Avro: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Avro with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Avro config knob?",
      "Avro production alert?"
    ]
  },
  {
    "id": "rapid-50",
    "topic": "CloudEvents",
    "level": "junior",
    "question": "Quick: one-line rule for CloudEvents in microservice communication?",
    "answer30s": "CloudEvents: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand CloudEvents with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "CloudEvents config knob?",
      "CloudEvents production alert?"
    ]
  },
  {
    "id": "rapid-51",
    "topic": "SPIFFE",
    "level": "senior",
    "question": "Quick: one-line rule for SPIFFE in microservice communication?",
    "answer30s": "SPIFFE: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand SPIFFE with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "SPIFFE config knob?",
      "SPIFFE production alert?"
    ]
  },
  {
    "id": "rapid-52",
    "topic": "NetworkPolicy",
    "level": "junior",
    "question": "Quick: one-line rule for NetworkPolicy in microservice communication?",
    "answer30s": "NetworkPolicy: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand NetworkPolicy with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "NetworkPolicy config knob?",
      "NetworkPolicy production alert?"
    ]
  },
  {
    "id": "rapid-53",
    "topic": "TLS rotation",
    "level": "junior",
    "question": "Quick: one-line rule for TLS rotation in microservice communication?",
    "answer30s": "TLS rotation: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand TLS rotation with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "TLS rotation config knob?",
      "TLS rotation production alert?"
    ]
  },
  {
    "id": "rapid-54",
    "topic": "Client credentials",
    "level": "senior",
    "question": "Quick: one-line rule for Client credentials in microservice communication?",
    "answer30s": "Client credentials: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Client credentials with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Client credentials config knob?",
      "Client credentials production alert?"
    ]
  },
  {
    "id": "rapid-55",
    "topic": "Refresh token",
    "level": "junior",
    "question": "Quick: one-line rule for Refresh token in microservice communication?",
    "answer30s": "Refresh token: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Refresh token with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Refresh token config knob?",
      "Refresh token production alert?"
    ]
  }
];

export const CHOOSE_QS: ScenarioQ[] = [
  {
    "id": "choose-1",
    "title": "Checkout payment authorization",
    "recommended": "Sync RestClient to PSP",
    "why": "User waits for yes/no; idempotency key mandatory",
    "alternative": "Async capture after sync auth",
    "tradeoffs": "Sync adds p99 tail; async-only breaks UX",
    "interviewAnswer": "Sync auth ≤2s timeout; Kafka for settlement"
  },
  {
    "id": "choose-2",
    "title": "Order confirmation email",
    "recommended": "Async Kafka OrderPlaced → NotificationSvc",
    "why": "At-least-once OK with dedupe; user already has orderId",
    "alternative": "Sync SMTP in checkout path",
    "tradeoffs": "Sync email blocks checkout on SendGrid lag",
    "interviewAnswer": "Never sync email in checkout; dedupe by orderId"
  },
  {
    "id": "choose-3",
    "title": "Inventory reservation at checkout",
    "recommended": "Sync RestClient hold with TTL",
    "why": "Prevent oversell before payment",
    "alternative": "Optimistic async reserve",
    "tradeoffs": "Async reserve risks payment on no stock",
    "interviewAnswer": "Sync hold; compensate release on payment fail"
  },
  {
    "id": "choose-4",
    "title": "Product catalog browse",
    "recommended": "Sync read via CDN/cache (AP stale OK)",
    "why": "Low latency; stale price refreshed at cart",
    "alternative": "Kafka push all catalog updates to client",
    "tradeoffs": "Push complexity vs simple HTTP cache",
    "interviewAnswer": "Sync cached read; strong price at checkout only"
  },
  {
    "id": "choose-5",
    "title": "Search index update on product edit",
    "recommended": "Async Kafka ProductUpdated → indexer",
    "why": "Decouple admin write from ES latency",
    "alternative": "Sync dual-write DB+ES",
    "tradeoffs": "Dual-write inconsistency without outbox",
    "interviewAnswer": "Outbox + consumer idempotent upsert"
  },
  {
    "id": "choose-6",
    "title": "Fraud score at payment",
    "recommended": "Sync call with 200ms budget + fail-closed",
    "why": "Block high-risk before capture",
    "alternative": "Async post-auth review",
    "tradeoffs": "Async allows fraud slip; sync adds latency",
    "interviewAnswer": "Sync fast rules; async ML enrichment after"
  },
  {
    "id": "choose-7",
    "title": "Bank balance inquiry after transfer",
    "recommended": "Sync read from primary (CP)",
    "why": "Read-your-writes regulatory expectation",
    "alternative": "Replica read AP",
    "tradeoffs": "Replica lag causes support tickets",
    "interviewAnswer": "Route session reads to primary post-mutation"
  },
  {
    "id": "choose-8",
    "title": "ACH settlement batch",
    "recommended": "Async file generation + SFTP",
    "why": "Batch windows; no user waiting",
    "alternative": "Sync per-transfer API",
    "tradeoffs": "Sync overloads core banking hours",
    "interviewAnswer": "Kafka TransferCompleted feeds batch builder"
  },
  {
    "id": "choose-9",
    "title": "AML screening",
    "recommended": "Async Kafka pipeline + post-hoc freeze",
    "why": "Model latency seconds; do not block teller",
    "alternative": "Sync AML in transfer path",
    "tradeoffs": "Sync meets compliance latency SLA rarely",
    "interviewAnswer": "Sync transfer; async AML with freeze capability"
  },
  {
    "id": "choose-10",
    "title": "Trade order submission",
    "recommended": "Sync gRPC to exchange adapter",
    "why": "Sub-ms ack requirement",
    "alternative": "Kafka order topic",
    "tradeoffs": "Kafka wrong for exchange ack deadline",
    "interviewAnswer": "gRPC + clientOrderId; async post-trade"
  },
  {
    "id": "choose-11",
    "title": "Market data ticks to strategies",
    "recommended": "Async Kafka partitioned by symbol",
    "why": "Fan-out firehose; ordering per symbol",
    "alternative": "Sync poll REST",
    "tradeoffs": "REST cannot scale tick rate",
    "interviewAnswer": "Kafka consumers with sequence gap detect"
  },
  {
    "id": "choose-12",
    "title": "Mobile home screen dashboard",
    "recommended": "BFF parallel WebClient + cached projections",
    "why": "Cut serial RTT; stale OK for counts",
    "alternative": "10 serial Feign calls",
    "tradeoffs": "Parallel increases burst load on deps",
    "interviewAnswer": "Parallel fetch + projection for aggregates"
  },
  {
    "id": "choose-13",
    "title": "Webhook delivery to merchant",
    "recommended": "Async outbox + retry with backoff + HMAC",
    "why": "Merchant uptime unknown; signed retries",
    "alternative": "Sync callback in request thread",
    "tradeoffs": "Sync blocks user response",
    "interviewAnswer": "Outbox worker; idempotent merchant handler"
  },
  {
    "id": "choose-14",
    "title": "Refund processing",
    "recommended": "Async saga with sync PSP refund call in step",
    "why": "PSP call sync idempotent; saga tracks state",
    "alternative": "Fire-and-forget Kafka only",
    "tradeoffs": "No sync loses refund confirmation",
    "interviewAnswer": "Orchestrated saga; sync PSP with idempotency"
  },
  {
    "id": "choose-15",
    "title": "Shopping cart merge on login",
    "recommended": "Sync RestClient merge endpoint",
    "why": "User sees merged cart immediately",
    "alternative": "Async merge job",
    "tradeoffs": "Async shows wrong cart briefly",
    "interviewAnswer": "Sync merge; Kafka for analytics only"
  },
  {
    "id": "choose-16",
    "title": "Warehouse pick list generation",
    "recommended": "Async Kafka OrderPaid → WMS",
    "why": "Fulfillment not in user path",
    "alternative": "Sync generate during checkout",
    "tradeoffs": "Adds seconds to checkout",
    "interviewAnswer": "Event-driven fulfillment; sync only inventory hold"
  },
  {
    "id": "choose-17",
    "title": "Shipment tracking updates",
    "recommended": "Async carrier webhooks → Kafka → notify",
    "why": "External event stream",
    "alternative": "Sync poll carrier API per page view",
    "tradeoffs": "Polling rate limits and lag",
    "interviewAnswer": "Webhook ingest async; sync read from cache DB"
  },
  {
    "id": "choose-18",
    "title": "Recommendation refresh",
    "recommended": "Async clickstream Kafka → ML batch",
    "why": "Stale recommendations acceptable minutes",
    "alternative": "Sync ML call per page",
    "tradeoffs": "Sync blows p99 and cost",
    "interviewAnswer": "Materialized recs; sync serve from cache"
  },
  {
    "id": "choose-19",
    "title": "User profile photo upload",
    "recommended": "Sync upload to object store + async thumbnail",
    "why": "User needs upload ack",
    "alternative": "Fully async queue upload",
    "tradeoffs": "Async delays error feedback",
    "interviewAnswer": "Sync store; Kafka ThumbnailRequested"
  },
  {
    "id": "choose-20",
    "title": "Password reset email",
    "recommended": "Async notification queue",
    "why": "Security token delivery tolerant seconds delay",
    "alternative": "Sync send in reset API",
    "tradeoffs": "Sync ties API to SMTP",
    "interviewAnswer": "Return 202 + async send with rate limit"
  },
  {
    "id": "choose-21",
    "title": "Rate limit exceeded response",
    "recommended": "Sync 429 with Retry-After header",
    "why": "Client needs immediate backpressure signal",
    "alternative": "Silent queue",
    "tradeoffs": "Queue hides overload from client",
    "interviewAnswer": "Gateway token bucket; 429 Problem Details"
  },
  {
    "id": "choose-22",
    "title": "Cross-service config refresh",
    "recommended": "Async Spring Cloud Bus / K8s watch",
    "why": "Config change not user-facing",
    "alternative": "Sync poll every request",
    "tradeoffs": "Poll adds latency and load",
    "interviewAnswer": "Push refresh; sync read local cache"
  },
  {
    "id": "choose-23",
    "title": "Distributed cache invalidation",
    "recommended": "Async Kafka cache-invalidate topic",
    "why": "Eventual cache OK for catalog",
    "alternative": "Sync RPC invalidate all nodes",
    "tradeoffs": "Sync fan-out fragile at scale",
    "interviewAnswer": "TTL + async invalidation; sync invalidate for price if needed"
  },
  {
    "id": "choose-24",
    "title": "Ledger posting after payment",
    "recommended": "Async idempotent consumer",
    "why": "Append-only ledger tolerates ms delay",
    "alternative": "Sync 2PC across Payment+Ledger",
    "tradeoffs": "2PC fragile across services",
    "interviewAnswer": "Outbox PaymentCaptured → ledger consumer UNIQUE(paymentId)"
  },
  {
    "id": "choose-25",
    "title": "Customer support order lookup",
    "recommended": "Sync read API from order read model",
    "why": "Agent waits on phone",
    "alternative": "Async ticket queue lookup",
    "tradeoffs": "Async unusable for live call",
    "interviewAnswer": "CQRS projection; sync GET by orderId"
  },
  {
    "id": "choose-26",
    "title": "Multi-step KYC verification",
    "recommended": "Orchestrated saga with sync external API steps",
    "why": "Each vendor call needs ack; workflow tracks state",
    "alternative": "Choreography only Kafka",
    "tradeoffs": "Choreography hard to debug KYC state",
    "interviewAnswer": "Temporal/Camunda or orchestrator; sync vendor with timeout"
  },
  {
    "id": "choose-27",
    "title": "Invoice PDF generation",
    "recommended": "Async job + polling/sync download when ready",
    "why": "PDF CPU heavy",
    "alternative": "Sync generate in billing API",
    "tradeoffs": "Sync timeout on large invoices",
    "interviewAnswer": "Kafka GenerateInvoice; sync GET status"
  },
  {
    "id": "choose-28",
    "title": "Real-time chat message delivery",
    "recommended": "Sync ack to sender + async fan-out via WebSocket hub/Kafka",
    "why": "Sender needs delivery ack; recipients async push",
    "alternative": "Pure Kafka chat",
    "tradeoffs": "Kafka alone adds delivery latency tail",
    "interviewAnswer": "Hybrid: sync persist; async push"
  },
  {
    "id": "choose-29",
    "title": "Stock price display ticker",
    "recommended": "Async WebSocket/SSE feed from Kafka MD",
    "why": "Push model; stale ms OK",
    "alternative": "Sync REST poll every second",
    "tradeoffs": "Poll destroys rate limits",
    "interviewAnswer": "SSE from gateway subscribed to MD topic"
  },
  {
    "id": "choose-30",
    "title": "Audit log append",
    "recommended": "Async Kafka audit topic (append-only)",
    "why": "Must not block business TX",
    "alternative": "Sync write audit in same HTTP thread",
    "tradeoffs": "Sync audit failure rolls back business?",
    "interviewAnswer": "Outbox or async append; sync only if compliance mandates inline"
  },
  {
    "id": "choose-31",
    "title": "Feature flag evaluation",
    "recommended": "Sync local cache read (ms)",
    "why": "Every request needs flag; cache refreshed async",
    "alternative": "Sync RPC to flag service each request",
    "tradeoffs": "RPC adds dependency to all paths",
    "interviewAnswer": "SDK cache + async refresh stream"
  },
  {
    "id": "choose-32",
    "title": "Geo-lookup for compliance",
    "recommended": "Sync call with CB + cache",
    "why": "Block request before data leaves region",
    "alternative": "Async geo tag later",
    "tradeoffs": "Async may process PII in wrong region",
    "interviewAnswer": "Sync edge geo gate; fail closed"
  },
  {
    "id": "choose-33",
    "title": "Bulk export 1M rows",
    "recommended": "Async export job + signed URL",
    "why": "Hours of work",
    "alternative": "Sync streaming HTTP",
    "tradeoffs": "Sync ties connection hours",
    "interviewAnswer": "Kafka ExportRequested; sync poll job status"
  },
  {
    "id": "choose-34",
    "title": "Health check dependency",
    "recommended": "Sync lightweight ping separate from deep check",
    "why": "K8s liveness must be fast",
    "alternative": "Deep check all deps in /health",
    "tradeoffs": "Deep check flaps pod on dep blip",
    "interviewAnswer": "Liveness shallow; readiness optional deps"
  },
  {
    "id": "choose-35",
    "title": "Service mesh mTLS rollout",
    "recommended": "Gradual PERMISSIVE → STRICT",
    "why": "Avoid big-bang comm break",
    "alternative": "STRICT day one",
    "tradeoffs": "Permissive window MITM risk brief",
    "interviewAnswer": "Istio peerAuthentication phased; monitor 503"
  },
  {
    "id": "choose-36",
    "title": "API breaking field removal",
    "recommended": "Expand-contract + dual publish + metric old version",
    "why": "Independent deploy safety",
    "alternative": "Break consumers Friday deploy",
    "tradeoffs": "Dual schema maintenance cost",
    "interviewAnswer": "Pact gate; deprecate v1 with traffic alert"
  },
  {
    "id": "choose-37",
    "title": "Payment 3DS step-up",
    "recommended": "Sync redirect flow to issuer",
    "why": "User interaction required now",
    "alternative": "Async 3DS email link only",
    "tradeoffs": "Async abandonment higher",
    "interviewAnswer": "Sync orchestration state machine"
  },
  {
    "id": "choose-38",
    "title": "Subscription renewal charge",
    "recommended": "Async scheduler + sync PSP charge idempotent",
    "why": "Batch renewals off-peak",
    "alternative": "Sync charge all at midnight cron thread",
    "tradeoffs": "Sync batch overloads PSP",
    "interviewAnswer": "Kafka RenewalDue; worker sync PSP"
  },
  {
    "id": "choose-39",
    "title": "Coupon validation at checkout",
    "recommended": "Sync PricingSvc validate",
    "why": "Must reject before payment",
    "alternative": "Async apply coupon post-order",
    "tradeoffs": "Async allows paid invalid coupon",
    "interviewAnswer": "Sync validate; async analytics on usage"
  },
  {
    "id": "choose-40",
    "title": "Multi-currency FX quote",
    "recommended": "Sync read from rate cache refreshed async",
    "why": "Checkout needs current rate snapshot",
    "alternative": "Async rate update only",
    "tradeoffs": "Stale rate financial loss",
    "interviewAnswer": "Sync quote with rate_version id; async rate feed"
  },
  {
    "id": "choose-41",
    "title": "Partner API order ingest",
    "recommended": "Sync 202 accepted + async process",
    "why": "Partner needs ack fast; validation async",
    "alternative": "Fully sync validate+create",
    "tradeoffs": "Sync validation spikes latency",
    "interviewAnswer": "Sync enqueue; Kafka ProcessPartnerOrder"
  },
  {
    "id": "choose-42",
    "title": "Internal admin bulk refund",
    "recommended": "Async batch job with per-item sync PSP",
    "why": "Operator triggers; long running",
    "alternative": "Sync loop in HTTP request",
    "tradeoffs": "Gateway timeout at 100 refunds",
    "interviewAnswer": "Job table + worker; progress sync poll"
  },
  {
    "id": "choose-43",
    "title": "Consent preference update GDPR",
    "recommended": "Sync persist + async propagate to analytics",
    "why": "User must see immediate consent state",
    "alternative": "Async only propagate",
    "tradeoffs": "Async illegal processing window",
    "interviewAnswer": "Sync write CP; Kafka ConsentChanged fan-out"
  },
  {
    "id": "choose-44",
    "title": "Device telemetry ingest IoT",
    "recommended": "Async Kafka high-throughput",
    "why": "Firehose; device not waiting per event",
    "alternative": "Sync REST per reading",
    "tradeoffs": "Sync cannot scale devices",
    "interviewAnswer": "MQTT/Kafka ingest; sync command channel separate"
  },
  {
    "id": "choose-45",
    "title": "Command to device (firmware)",
    "recommended": "Sync ack command queued + async delivery",
    "why": "API confirms acceptance",
    "alternative": "Sync wait device ACK 60s",
    "tradeoffs": "Long sync ties threads",
    "interviewAnswer": "Command id + async delivery status topic"
  },
  {
    "id": "choose-46",
    "title": "GraphQL product page",
    "recommended": "BFF GraphQL with batched RestClient + dataloaders",
    "why": "Single round trip; batch downstream",
    "alternative": "GraphQL resolver N+1 Feign",
    "tradeoffs": "N+1 melts inventory service",
    "interviewAnswer": "DataLoader batch; timeout per batch"
  },
  {
    "id": "choose-47",
    "title": "Cross-region read replica routing",
    "recommended": "Sync local replica for reads; sync primary for write",
    "why": "Latency vs consistency trade per op",
    "alternative": "All cross-region sync primary",
    "tradeoffs": "WAN RTT on every read",
    "interviewAnswer": "Geographic routing; sticky write leader"
  },
  {
    "id": "choose-48",
    "title": "Scheduled report to CFO",
    "recommended": "Async generate + email link",
    "why": "Heavy aggregation",
    "alternative": "Sync wait in dashboard",
    "tradeoffs": "Browser timeout",
    "interviewAnswer": "Kafka ReportScheduled; object store URL"
  },
  {
    "id": "choose-49",
    "title": "Anti-fraud velocity check login",
    "recommended": "Sync Redis INCR + threshold",
    "why": "Block before token issued",
    "alternative": "Async analyze login batch",
    "tradeoffs": "Async allows credential stuffing window",
    "interviewAnswer": "Sync edge check; async ML enrich"
  },
  {
    "id": "choose-50",
    "title": "Service-to-service nightly reconciliation",
    "recommended": "Async batch compare ledgers",
    "why": "Not user path",
    "alternative": "Sync lock both DBs",
    "tradeoffs": "Sync lock cross-service impossible",
    "interviewAnswer": "Kafka trigger; idempotent diff report"
  }
];

export const INCIDENTS: Incident[] = [
  {
    "id": "inc-1",
    "title": "Checkout timeout cascade",
    "symptoms": "All checkouts 504; Tomcat threads maxed",
    "metrics": "http_server_active_threads=max",
    "logs": "SocketTimeoutException PSP",
    "rootCause": "PaymentSvc timeout removed in deploy",
    "mitigate": "Rollback timeout; open CB",
    "permanent": "Mandatory RestClient timeouts in code review",
    "architecture": "BFF→Order→Payment sync chain",
    "interviewAnswer": "Timeout missing → pool exhaust → cascade"
  },
  {
    "id": "inc-2",
    "title": "Feign retry double charge",
    "symptoms": "Duplicate charges same window",
    "metrics": "feign_retry_total↑",
    "logs": "Retry attempt 2 POST /capture",
    "rootCause": "Feign default retry on POST",
    "mitigate": "Disable Feign retry; reconcile",
    "permanent": "Idempotency store + no POST retry",
    "architecture": "OrderSvc Feign→PaymentSvc",
    "interviewAnswer": "Never Feign-retry POST"
  },
  {
    "id": "inc-3",
    "title": "WebClient pool exhausted",
    "symptoms": "503 inventory; pending acquire timeout",
    "metrics": "reactor.netty.pending.connections=max",
    "logs": "PoolAcquirePendingLimitException",
    "rootCause": "maxConnections=50; need 200",
    "mitigate": "Raise pool; shed load 429",
    "permanent": "Little's Law pool sizing",
    "architecture": "BFF parallel WebClient",
    "interviewAnswer": "Pool math wrong for parallel fan-out"
  },
  {
    "id": "inc-4",
    "title": "gRPC deadline not propagated",
    "symptoms": "Upstream cancelled; downstream working",
    "metrics": "grpc_calls_without_deadline",
    "logs": "Context deadline exceeded",
    "rootCause": "Missing deadline interceptor",
    "mitigate": "Deploy interceptor",
    "permanent": "Client deadline < gateway",
    "architecture": "OrderGw gRPC→RiskSvc",
    "interviewAnswer": "Propagate grpc deadline always"
  },
  {
    "id": "inc-5",
    "title": "Kubernetes DNS stale endpoints",
    "symptoms": "Intermittent connection refused old pod IP",
    "metrics": "502 burst",
    "logs": "Connection refused old IP",
    "rootCause": "Client cache + keep-alive stale",
    "mitigate": "Restart clients; shorten idle",
    "permanent": "Max connection lifetime",
    "architecture": "Feign via K8s service",
    "interviewAnswer": "DNS/cache + keep-alive dead pod"
  },
  {
    "id": "inc-6",
    "title": "Retry storm during recovery",
    "symptoms": "Payment recovered still 503",
    "metrics": "effective RPS 5× baseline",
    "logs": "Retry attempt 3 everywhere",
    "rootCause": "Stacked retries metastable",
    "mitigate": "Disable retries globally",
    "permanent": "Single retry owner jitter",
    "architecture": "Gateway+Feign+SDK",
    "interviewAnswer": "Shed load to recover"
  },
  {
    "id": "inc-7",
    "title": "Circuit breaker stuck OPEN",
    "symptoms": "Fraud always fallback; svc healthy",
    "metrics": "cb_state=OPEN 45min",
    "logs": "CallNotPermittedException",
    "rootCause": "Half-open probe wrong path",
    "mitigate": "Manual CB reset",
    "permanent": "Half-open test /health",
    "architecture": "Payment→Fraud RestClient",
    "interviewAnswer": "Verify half-open probes"
  },
  {
    "id": "inc-8",
    "title": "Kafka consumer lag emails",
    "symptoms": "Emails hours late; lag 500k",
    "metrics": "kafka.consumer.lag max",
    "logs": "max.poll.interval exceeded",
    "rootCause": "Slow SMTP consumer",
    "mitigate": "Scale to partition count",
    "permanent": "Separate notification group DLQ",
    "architecture": "OrderPlaced→Notification",
    "interviewAnswer": "Consumer slower than produce"
  },
  {
    "id": "inc-9",
    "title": "429 rate limit retry amp",
    "symptoms": "PSP throttling; RPS doubled",
    "metrics": "http_429_total",
    "logs": "Immediate retry on 429",
    "rootCause": "Ignores Retry-After",
    "mitigate": "Honor backoff",
    "permanent": "Respect Retry-After header",
    "architecture": "PaymentSvc→PSP",
    "interviewAnswer": "429 is backpressure"
  },
  {
    "id": "inc-10",
    "title": "502 bad gateway deploy",
    "symptoms": "BFF 502; upstream unclear",
    "metrics": "gateway_upstream_unhealthy",
    "logs": "Connection reset mid-response",
    "rootCause": "Pod killed mid-request deploy",
    "mitigate": "Retry idempotent GET",
    "permanent": "PreStop sleep graceful",
    "architecture": "Gateway→OrderSvc rollout",
    "interviewAnswer": "502 during drain fix shutdown"
  },
  {
    "id": "inc-11",
    "title": "503 thread pool overload",
    "symptoms": "All routes 503; CPU moderate",
    "metrics": "thread pool rejected",
    "logs": "TaskRejectedException",
    "rootCause": "Pool too small RPS×latency",
    "mitigate": "Scale pods; 429 gateway",
    "permanent": "Little's Law Tomcat VT",
    "architecture": "OrderSvc Tomcat",
    "interviewAnswer": "503 from saturation"
  },
  {
    "id": "inc-12",
    "title": "504 gateway timeout",
    "symptoms": "Client 504; upstream still working",
    "metrics": "gateway_request_timeout",
    "logs": "Upstream 200 after 65s",
    "rootCause": "Gateway 60s < saga 90s",
    "mitigate": "Extend checkout route timeout",
    "permanent": "Async long steps",
    "architecture": "Gateway→Checkout saga",
    "interviewAnswer": "Align timeouts or async"
  },
  {
    "id": "inc-13",
    "title": "TLS cert expiry",
    "symptoms": "All mTLS handshake fail",
    "metrics": "ssl_handshake_failures spike",
    "logs": "certificate expired",
    "rootCause": "Cert rotation missed",
    "mitigate": "Emergency cert deploy",
    "permanent": "cert-manager auto rotate",
    "architecture": "Istio mTLS STRICT",
    "interviewAnswer": "Automate rotation alert T-30d"
  },
  {
    "id": "inc-14",
    "title": "JWT expired mid-chain",
    "symptoms": "403 downstream; user logged in",
    "metrics": "jwt_expired_errors",
    "logs": "Bearer expired at InventorySvc",
    "rootCause": "Long chain exceeds JWT TTL",
    "mitigate": "Token exchange service token",
    "permanent": "Refresh at gateway",
    "architecture": "Gateway→Order→Inventory",
    "interviewAnswer": "Service token or refresh"
  },
  {
    "id": "inc-15",
    "title": "JWT wrong audience",
    "symptoms": "403 invalid_audience sporadic",
    "metrics": "oauth2_invalid_audience",
    "logs": "aud mismatch",
    "rootCause": "Blind JWT forward",
    "mitigate": "Token exchange per audience",
    "permanent": "Client credentials internal",
    "architecture": "Order forwards JWT Payment",
    "interviewAnswer": "Audience binding exchange"
  },
  {
    "id": "inc-16",
    "title": "Outbox publisher stuck",
    "symptoms": "Orders confirmed; no events",
    "metrics": "outbox_unpublished_count↑",
    "logs": "OutboxPoller SQLException",
    "rootCause": "DB migration lock outbox",
    "mitigate": "Fix migration replay",
    "permanent": "Monitor outbox depth",
    "architecture": "Transactional outbox→Kafka",
    "interviewAnswer": "Monitor outbox lag"
  },
  {
    "id": "inc-17",
    "title": "Saga compensation failed",
    "symptoms": "Inventory released; payment captured",
    "metrics": "saga_compensation_error",
    "logs": "CompensatePayment 500",
    "rootCause": "Compensation not idempotent",
    "mitigate": "Manual refund runbook",
    "permanent": "Idempotent compensate",
    "architecture": "Checkout saga",
    "interviewAnswer": "Compensation idempotent audit"
  },
  {
    "id": "inc-18",
    "title": "Kafka hot partition",
    "symptoms": "One consumer lag high others idle",
    "metrics": "lag skew 100:1",
    "logs": "Partition 3 hot merchant key",
    "rootCause": "Partition key top merchant",
    "mitigate": "Salt key split topic",
    "permanent": "Key design review",
    "architecture": "PaymentEvents keyed merchantId",
    "interviewAnswer": "Re-key not more consumers"
  },
  {
    "id": "inc-19",
    "title": "Consumer rebalance storm",
    "symptoms": "Lag spikes every 2min",
    "metrics": "rebalance.rate high",
    "logs": "Revoke partitions",
    "rootCause": "GC exceeds max.poll.interval",
    "mitigate": "Fix GC increase interval",
    "permanent": "static.group.instance.id",
    "architecture": "Settlement consumer",
    "interviewAnswer": "Rebalance stops processing"
  },
  {
    "id": "inc-20",
    "title": "Poison message infinite retry",
    "symptoms": "Consumer stuck on offset",
    "metrics": "single partition lag",
    "logs": "JsonParseException same offset",
    "rootCause": "No DLQ",
    "mitigate": "Skip to DLQ manually",
    "permanent": "DefaultErrorHandler DLT",
    "architecture": "OrderPlaced consumer",
    "interviewAnswer": "DLQ poison messages"
  },
  {
    "id": "inc-21",
    "title": "Schema Registry incompatible",
    "symptoms": "Consumer deserialize fail all pods",
    "metrics": "serde_errors",
    "logs": "Incompatible schema id",
    "rootCause": "Removed required field",
    "mitigate": "Rollback producer",
    "permanent": "CI compatibility check",
    "architecture": "Avro PaymentEvent",
    "interviewAnswer": "Schema gate in CI"
  },
  {
    "id": "inc-22",
    "title": "Pact contract drift",
    "symptoms": "Order 500 after Payment deploy",
    "metrics": "missing_field NPE",
    "logs": "NullPointer paymentStatus",
    "rootCause": "Deploy without pact verify",
    "mitigate": "Rollback Payment",
    "permanent": "Pact verify CI gate",
    "architecture": "Order Feign Payment",
    "interviewAnswer": "Contract gate deploy"
  },
  {
    "id": "inc-23",
    "title": "Feign hardcoded IP",
    "symptoms": "Traffic to terminated node",
    "metrics": "connection refused single IP",
    "logs": "Feign http://10.0.1.5:8080",
    "rootCause": "Hardcoded IP bypasses K8s",
    "mitigate": "Fix service name URL",
    "permanent": "Ban literal IPs lint",
    "architecture": "Feign wrong url",
    "interviewAnswer": "Service discovery hostname"
  },
  {
    "id": "inc-24",
    "title": "RestTemplate no timeout Boot 3",
    "symptoms": "Hang forever internal calls",
    "metrics": "resttemplate no micrometer",
    "logs": "Infinite socket wait",
    "rootCause": "Legacy RestTemplate",
    "mitigate": "Migrate RestClient",
    "permanent": "Ban RestTemplate new code",
    "architecture": "Legacy RestTemplate",
    "interviewAnswer": "RestClient HttpClient timeouts"
  },
  {
    "id": "inc-25",
    "title": "Virtual thread pinning",
    "symptoms": "Latency spike Java 21",
    "metrics": "pinning events",
    "logs": "Pinned virtual thread synchronized",
    "rootCause": "synchronized HTTP internals",
    "mitigate": "Reduce pinning",
    "permanent": "Audit synchronized VT path",
    "architecture": "Tomcat VT RestClient",
    "interviewAnswer": "VT pinning audit"
  },
  {
    "id": "inc-26",
    "title": "ThreadLocal trace lost async",
    "symptoms": "Broken traces @Async",
    "metrics": "orphan spans",
    "logs": "New traceId async thread",
    "rootCause": "Manual ThreadLocal trace",
    "mitigate": "Enable OTel propagation",
    "permanent": "Micrometer TaskDecorator",
    "architecture": "@Async notification",
    "interviewAnswer": "OTel not ThreadLocal"
  },
  {
    "id": "inc-27",
    "title": "CORS preflight doubles latency",
    "symptoms": "Mobile slow first call",
    "metrics": "OPTIONS traffic 40%",
    "logs": "Duplicate OPTIONS",
    "rootCause": "Custom headers preflight",
    "mitigate": "Gateway CORS Max-Age",
    "permanent": "Minimize custom headers",
    "architecture": "Browser cross-origin",
    "interviewAnswer": "Reduce preflight cache"
  },
  {
    "id": "inc-28",
    "title": "Compression gzip CPU",
    "symptoms": "High CPU latency up",
    "metrics": "gzip CPU high",
    "logs": "GC pressure compression",
    "rootCause": "gzip large JSON globally",
    "mitigate": "Disable small payload gzip",
    "permanent": "Compress >1KB only",
    "architecture": "Gateway compression",
    "interviewAnswer": "Selective compression"
  },
  {
    "id": "inc-29",
    "title": "Keep-alive dead upstream",
    "symptoms": "502 after deploy 2min",
    "metrics": "upstream connect errors",
    "logs": "Reuse connection reset",
    "rootCause": "Keep-alive to drained pod",
    "mitigate": "Max connection lifetime",
    "permanent": "Align idle timeout",
    "architecture": "RestClient keep-alive",
    "interviewAnswer": "Max lifetime post-deploy"
  },
  {
    "id": "inc-30",
    "title": "SNAT port exhaustion",
    "symptoms": "Egress intermittent fail",
    "metrics": "SNAT 100%",
    "logs": "Cannot assign address",
    "rootCause": "Too many outbound connections",
    "mitigate": "NAT scale reduce churn",
    "permanent": "Connection pooling egress",
    "architecture": "Pods outbound PSP",
    "interviewAnswer": "Pool outbound SNAT finite"
  },
  {
    "id": "inc-31",
    "title": "Istio retry hides cause",
    "symptoms": "3× load on failing svc",
    "metrics": "istio_requests_retries",
    "logs": "upstream_rq_retry",
    "rootCause": "VirtualService retry 3×",
    "mitigate": "Disable mesh retry payment",
    "permanent": "One retry layer",
    "architecture": "Istio VirtualService",
    "interviewAnswer": "Mesh OR app retry not both"
  },
  {
    "id": "inc-32",
    "title": "Health check calls database",
    "symptoms": "All pods not ready DB blip",
    "metrics": "readiness fail 100%",
    "logs": "Health DataSource failed",
    "rootCause": "Readiness includes DB",
    "mitigate": "Split liveness readiness",
    "permanent": "Readiness critical only",
    "architecture": "Actuator /health",
    "interviewAnswer": "Liveness cheap"
  },
  {
    "id": "inc-33",
    "title": "Graceful shutdown ignored",
    "symptoms": "In-flight checkout fail deploy",
    "metrics": "502 during rollout",
    "logs": "Killed mid-request SIGTERM",
    "rootCause": "shutdown phase too short",
    "mitigate": "PreStop sleep increase",
    "permanent": "30s drain readiness remove",
    "architecture": "K8s rolling OrderSvc",
    "interviewAnswer": "PreStop drain sequence"
  },
  {
    "id": "inc-34",
    "title": "BFF serial Feign chain",
    "symptoms": "Home screen p99 2s",
    "metrics": "serial span depth 6",
    "logs": "6 sequential Feign 300ms",
    "rootCause": "Developer chained sync",
    "mitigate": "Parallel WebClient",
    "permanent": "Trace depth alert",
    "architecture": "Mobile BFF Feign",
    "interviewAnswer": "Parallelize or project"
  },
  {
    "id": "inc-35",
    "title": "Redis cross-tenant leak",
    "symptoms": "User A sees User B cart",
    "metrics": "cache key collision",
    "logs": "Same session key no tenant",
    "rootCause": "Cache key missing tenantId",
    "mitigate": "Flush cache hotfix keys",
    "permanent": "Tenant in every cache key",
    "architecture": "BFF Redis session",
    "interviewAnswer": "Tenant isolation keys"
  },
  {
    "id": "inc-36",
    "title": "Webhook replay attack",
    "symptoms": "Duplicate merchant events",
    "metrics": "same event_id twice",
    "logs": "Missing timestamp tolerance",
    "rootCause": "No idempotency webhook",
    "mitigate": "Reject old signatures",
    "permanent": "HMAC event_id dedup",
    "architecture": "Partner webhook",
    "interviewAnswer": "HMAC idempotent event_id"
  },
  {
    "id": "inc-37",
    "title": "GraphQL N+1 inventory",
    "symptoms": "Inventory RPS 50× product",
    "metrics": "inventory QPS spike",
    "logs": "Feign per GraphQL field",
    "rootCause": "Resolver N+1",
    "mitigate": "DataLoader batch",
    "permanent": "Batched inventory API",
    "architecture": "GraphQL BFF",
    "interviewAnswer": "DataLoader batch N+1"
  },
  {
    "id": "inc-38",
    "title": "Cross-region sync latency",
    "symptoms": "EU users 800ms checkout",
    "metrics": "cross_region_latency",
    "logs": "US Payment from EU Order",
    "rootCause": "Sync crosses Atlantic",
    "mitigate": "Route regional Payment",
    "permanent": "Data locality async reconcile",
    "architecture": "Global Order US Payment",
    "interviewAnswer": "Regional sync deps"
  },
  {
    "id": "inc-39",
    "title": "Problem Details stack leak",
    "symptoms": "Security scan finding",
    "metrics": "n/a",
    "logs": "SQLException in detail",
    "rootCause": "Exception copied to detail",
    "mitigate": "Strip safe messages",
    "permanent": "Sanitize ProblemDetail",
    "architecture": "REST errors",
    "interviewAnswer": "Safe detail no stack"
  },
  {
    "id": "inc-40",
    "title": "Hedged request doubled load",
    "symptoms": "Dependency 2× RPS incident",
    "metrics": "hedged_requests_sent",
    "logs": "Backup request p95",
    "rootCause": "Hedging all calls",
    "mitigate": "Disable hedging",
    "permanent": "Hedge idempotent read only",
    "architecture": "Hedging filter",
    "interviewAnswer": "Hedging multiplies load"
  },
  {
    "id": "inc-41",
    "title": "Sticky session lost deploy",
    "symptoms": "Cart empty random",
    "metrics": "session affinity break",
    "logs": "Pod switch mid-session",
    "rootCause": "Rolling deploy breaks sticky",
    "mitigate": "External Redis session",
    "permanent": "Stateless JWT or Redis",
    "architecture": "ALB sticky cart memory",
    "interviewAnswer": "No in-memory session alone"
  },
  {
    "id": "inc-42",
    "title": "@Async afterCommit lost",
    "symptoms": "Payment ok email never",
    "metrics": "async_queue rejected",
    "logs": "TaskRejectedException @Async",
    "rootCause": "Thread pool full afterCommit",
    "mitigate": "Kafka instead @Async",
    "permanent": "Outbox not @Async critical",
    "architecture": "@TransactionalEventListener",
    "interviewAnswer": "@Async fragile use outbox"
  },
  {
    "id": "inc-43",
    "title": "Feign FULL logger PCI",
    "symptoms": "PAN in logs audit fail",
    "metrics": "n/a",
    "logs": "Feign FULL body card",
    "rootCause": "loggerLevel FULL prod",
    "mitigate": "Scrub logs rotate keys",
    "permanent": "BASIC/NONE prod",
    "architecture": "Feign Payment",
    "interviewAnswer": "Never FULL on payment"
  },
  {
    "id": "inc-44",
    "title": "Missing Idempotency-Key duplicate",
    "symptoms": "Double orders same request",
    "metrics": "duplicate_order_id",
    "logs": "Two POST same body retry",
    "rootCause": "Mobile retry no key",
    "mitigate": "Merge orders support",
    "permanent": "Require Idempotency-Key",
    "architecture": "Mobile→Order API",
    "interviewAnswer": "Server idempotency before retry"
  },
  {
    "id": "inc-45",
    "title": "Kafka request-reply checkout",
    "symptoms": "Checkout hangs consumer lag",
    "metrics": "request_reply_timeout",
    "logs": "Reply not received rebalance",
    "rootCause": "RPC-over-Kafka user path",
    "mitigate": "Revert RestClient path",
    "permanent": "Ban request-reply user flows",
    "architecture": "Checkout Kafka request",
    "interviewAnswer": "User path sync REST"
  },
  {
    "id": "inc-46",
    "title": "Eureka stale routing",
    "symptoms": "503 to dead instance",
    "metrics": "eureka registry stale",
    "logs": "Route to DOWN instance",
    "rootCause": "Self-preservation dead instances",
    "mitigate": "Disable self-preservation test",
    "permanent": "Migrate K8s discovery",
    "architecture": "Spring Cloud Eureka",
    "interviewAnswer": "Prefer K8s DNS"
  },
  {
    "id": "inc-47",
    "title": "SCC stub drift",
    "symptoms": "CI green prod fail",
    "metrics": "stub_version mismatch",
    "logs": "Field removed not contract",
    "rootCause": "Producer changed no stub",
    "mitigate": "Publish new stub jar",
    "permanent": "Contract in provider pipeline",
    "architecture": "Spring Cloud Contract",
    "interviewAnswer": "Stub version match release"
  },
  {
    "id": "inc-48",
    "title": "OTel baggage PII leak",
    "symptoms": "GDPR incident",
    "metrics": "n/a",
    "logs": "email in baggage",
    "rootCause": "Debug baggage enabled",
    "mitigate": "Disable baggage prod",
    "permanent": "Allowlist baggage keys",
    "architecture": "OTel mesh",
    "interviewAnswer": "No PII in baggage"
  },
  {
    "id": "inc-49",
    "title": "Readiness includes Kafka",
    "symptoms": "Pod not ready broker maintenance",
    "metrics": "readiness down all",
    "logs": "Kafka health DOWN readiness",
    "rootCause": "Actuator Kafka on readiness",
    "mitigate": "Optional Kafka health",
    "permanent": "Readiness critical path only",
    "architecture": "Producer readiness",
    "interviewAnswer": "Kafka blip should not kill all"
  }
];

export const SPOKEN = {
  "thirtySec": "Microservice communication: sync REST/gRPC when the caller needs an answer now — checkout auth, inventory hold, balance read. Async Kafka/outbox for fan-out, settlement, notifications. Every sync call in Java 21 Spring Boot 3 uses RestClient or gRPC with connect+read timeout, Resilience4j circuit breaker and bulkhead, and idempotency on mutations. Propagate W3C trace context and OAuth2 carefully — mTLS for service identity. Size pools with Little's Law: concurrency ≈ RPS × p99 latency.",
  "twoMin": "I split flows by user deadline. Payment checkout: sync orchestration — BFF or orchestrator calls Inventory hold, Pricing quote, Payment auth via RestClient with 2s timeout, Idempotency-Key, CB fail-fast on PSP. After DB commit, transactional outbox publishes PaymentAuthorized to Kafka for settlement, ledger, email — idempotent consumers, DLQ for poison. I reject chatty serial chains — parallel WebClient or CQRS projections for reads. Anti-patterns: no timeout, Feign retry on POST, Kafka request-reply for UX, shared database. Observability: RED metrics per service, OpenTelemetry across RestClient and Kafka headers. Errors: RFC 9457 Problem Details with traceId. Independent deploy: Pact or Spring Cloud Contract plus Schema Registry compatibility. Capacity: Little's Law sizes Tomcat and WebClient pools; retry storms cause metastable failure — one retry layer, jitter, shed load to recover.",
  "fiveMinStaff": "Staff depth: walk payment/ecommerce/banking/trading architectures naming which steps are sync vs async and why — auth sync, settlement async, market data Kafka, ledger CP sync. TRICKS-OLD mnemonic: Timeout, Retry careful, Idempotency, Circuit breaker, Kafka/async fit, Security TLS+mTLS+JWT exchange, Observability RED+OTel, Failure cascade math, Load balancing+pool sizing, Discovery+DNS staleness. Explain cascading failure: effective λ = RPS × (1+retries); recovery needs load < 0.7 capacity — CB and 429 shed. Compare RestClient vs WebClient vs Feign vs gRPC — Feign convenience vs explicit RestClient timeouts; gRPC deadlines for trading. Mesh mTLS STRICT with token exchange not blind JWT forward. Virtual threads Tomcat Boot 3 with pinning audit. Contract testing gates: Pact consumer-driven, SCC producer stubs, Avro BACKWARD. Incident triage: thread dump pool blocked → timeout missing; duplicate charge → Feign POST retry; lag skew → hot partition key. Decision tree: user waiting? sync. Fan-out/reconcile? async outbox. Strong invariant now? sync CP. Stale OK? cache/AP. Principal: hybrid within one product; prove with traces, SLO burn, game days."
};

export const SENIOR_VS_STAFF = [
  {
    "topic": "Sync vs async choice",
    "junior": "Kafka is modern so use events",
    "senior": "User deadline and invariant drive sync vs async per step",
    "staff": "Hybrid journey map with SLO, outbox seam, compensation — quantify stale vs wrong"
  },
  {
    "topic": "Timeout configuration",
    "junior": "Default is fine internal",
    "senior": "RestClient HttpClient connect+read timeout per dependency",
    "staff": "Timeout hierarchy aligned gateway>BFF>client; Little's Law pool proof"
  },
  {
    "topic": "Retry policy",
    "junior": "Retry 3 times always",
    "senior": "Idempotent GET only; jitter; one retry owner",
    "staff": "Metastable math; retry budget; POST Idempotency-Key dedup store"
  },
  {
    "topic": "Circuit breaker",
    "junior": "CB makes service resilient",
    "senior": "CB+timeout; fail-open vs fail-closed by domain",
    "staff": "Half-open probe design; OPEN runbook; game day OPEN behavior"
  },
  {
    "topic": "Feign vs RestClient",
    "junior": "Feign is easier",
    "senior": "Boot 3 RestClient explicit; Feign needs timeout/retry config",
    "staff": "Feign POST retry risk; ErrorDecoder; migrate off RestTemplate"
  },
  {
    "topic": "gRPC vs REST",
    "junior": "gRPC always faster",
    "senior": "gRPC for low-latency service mesh; REST for browser/public",
    "staff": "Deadline propagation; NLB ALB; Fix vs proto evolution"
  },
  {
    "topic": "Kafka usage",
    "junior": "Kafka replaces all APIs",
    "senior": "Kafka fan-out/async; not user-facing request path",
    "staff": "Outbox, idempotent consumer, schema compat, hot key, rebalance"
  },
  {
    "topic": "JWT propagation",
    "junior": "Forward Authorization header",
    "senior": "Audience check or token exchange",
    "staff": "Zero-trust mTLS + short internal token; no JWT in Kafka logs"
  },
  {
    "topic": "Observability",
    "junior": "Logs enough",
    "senior": "RED + distributed trace RestClient/Kafka",
    "staff": "Tail sampling; exemplars; cardinality budget; SLO burn alerts"
  },
  {
    "topic": "Capacity sizing",
    "junior": "Increase threads if slow",
    "senior": "Little's Law RPS×latency",
    "staff": "Iterative p99; SNAT/pool limits; VT pinning audit"
  },
  {
    "topic": "Contract testing",
    "junior": "Integration tests enough",
    "senior": "Pact/SCC in CI before deploy",
    "staff": "Expand-contract migration; dual version traffic metric; registry gate"
  },
  {
    "topic": "API errors",
    "junior": "Return 500 with message",
    "senior": "RFC 9457 Problem Details + traceId",
    "staff": "Typed problem URIs; retryable flag; BFF mapping without semantic loss"
  },
  {
    "topic": "Cascading failure",
    "junior": "Scale pods",
    "senior": "CB bulkhead shed load",
    "staff": "Metastable recovery timeline; disable retries globally to heal"
  },
  {
    "topic": "Service discovery",
    "junior": "Eureka for microservices",
    "senior": "K8s DNS + Spring Cloud K8s",
    "staff": "DNS TTL + connection max life; stale endpoint game day"
  },
  {
    "topic": "BFF pattern",
    "junior": "BFF calls all services",
    "senior": "Parallel fetch + projection",
    "staff": "Trace depth SLO; blast radius; tenant isolation keys"
  }
];

export const CHEAT_ROWS = [
  {
    "term": "Sync REST",
    "rule": "Caller needs answer now; RestClient + timeout",
    "trap": "Sync chain >3 hops"
  },
  {
    "term": "Async Kafka",
    "rule": "Fan-out, reconcile, notify; outbox after commit",
    "trap": "Kafka RPC user wait"
  },
  {
    "term": "RestClient",
    "rule": "Boot 3 sync; HttpClient timeouts required",
    "trap": "Default infinite wait"
  },
  {
    "term": "WebClient",
    "rule": "Parallel/non-blocking; responseTimeout + pool size",
    "trap": "Pool default too small"
  },
  {
    "term": "OpenFeign",
    "rule": "Declarative; configure timeout/retry explicitly",
    "trap": "Default retry on POST"
  },
  {
    "term": "gRPC",
    "rule": "Low latency; propagate deadline",
    "trap": "Browser direct gRPC"
  },
  {
    "term": "Timeout",
    "rule": "connect + read < caller deadline",
    "trap": "CB without timeout"
  },
  {
    "term": "Retry",
    "rule": "Idempotent only; jitter; max 2",
    "trap": "Stacked gateway+Feign+SDK"
  },
  {
    "term": "Circuit breaker",
    "rule": "Fail fast; half-open probe",
    "trap": "CB as only resilience"
  },
  {
    "term": "Bulkhead",
    "rule": "Isolate pool per dependency",
    "trap": "One pool all deps"
  },
  {
    "term": "Idempotency-Key",
    "rule": "POST dedup UNIQUE key",
    "trap": "Retry POST without key"
  },
  {
    "term": "Outbox",
    "rule": "Same TX as business row + publish",
    "trap": "Dual write DB+Kafka"
  },
  {
    "term": "Saga",
    "rule": "Compensate; orchestrator or choreo",
    "trap": "2PC across services"
  },
  {
    "term": "Little's Law",
    "rule": "L ≈ RPS × p99 sec",
    "trap": "Size from mean latency"
  },
  {
    "term": "mTLS",
    "rule": "Service identity mesh/sidecar",
    "trap": "mTLS replaces authz"
  },
  {
    "term": "JWT",
    "rule": "User context; validate aud",
    "trap": "Blind forward downstream"
  },
  {
    "term": "Token exchange",
    "rule": "Internal short-lived svc token",
    "trap": "Long chain user JWT"
  },
  {
    "term": "Problem Details",
    "rule": "RFC 9457 type+status+traceId",
    "trap": "Stack in detail field"
  },
  {
    "term": "Pact",
    "rule": "Consumer-driven CI gate",
    "trap": "Pact replaces all IT"
  },
  {
    "term": "Schema Registry",
    "rule": "BACKWARD compatibility",
    "trap": "Remove field no major"
  },
  {
    "term": "RED",
    "rule": "Rate Errors Duration per route",
    "trap": "High-cardinality labels"
  },
  {
    "term": "OpenTelemetry",
    "rule": "W3C trace RestClient+Kafka",
    "trap": "ThreadLocal manual trace"
  },
  {
    "term": "503",
    "rule": "Server overload; backoff",
    "trap": "Instant retry storm"
  },
  {
    "term": "429",
    "rule": "Honor Retry-After",
    "trap": "Immediate retry"
  },
  {
    "term": "504",
    "rule": "Gateway timeout; async long work",
    "trap": "Raise gateway to 300s"
  },
  {
    "term": "502",
    "rule": "Bad gateway; drain/deploy",
    "trap": "Retry non-idempotent POST"
  },
  {
    "term": "DNS stale",
    "rule": "Max connection lifetime",
    "trap": "Keep-alive forever"
  },
  {
    "term": "Virtual threads",
    "rule": "Tomcat Boot 3 scale blocking I/O",
    "trap": "synchronized pinning ignored"
  },
  {
    "term": "Partition key",
    "rule": "Affinity + parallelism balance",
    "trap": "Hot merchant key"
  },
  {
    "term": "DLQ",
    "rule": "Poison message exit",
    "trap": "Infinite deserialize retry"
  }
];

export const DECISION_ASCII = "\nSync vs Async — Microservice Communication Decision Tree\n═══════════════════════════════════════════════════════\nIs a human or API client waiting for the result NOW?\n  NO  → Prefer ASYNC (Kafka + outbox/inbox, idempotent consumer)\n        │  Examples: email, settlement, search index, analytics\n        │  Require: schema compat, DLQ, lag alerts\n  YES → SYNC required (REST/gRPC) — continue below\n\nMust business invariant hold immediately (money, inventory, auth)?\n  YES → SYNC CP path: short timeout, idempotency, fail-closed option\n        │  RestClient/gRPC + Resilience4j CB + bulkhead\n        │  Read-after-write routing if user just mutated\n  NO  → Can stale OK for this read?\n        YES → SYNC AP: cache/CDN/replica with TTL + refresh at commit point\n        NO  → SYNC strong read or async projection refresh\n\nIs fan-out to many subscribers?\n  YES → After sync commit: outbox → Kafka (NOT sync loop each)\n  NO  → Single downstream: sync if deadline tight else consider async\n\nLatency budget (<300ms user-facing)?\n  YES → gRPC or parallel WebClient; cap hops ≤3; no serial BFF chain\n  NO  → Orchestrated saga OK; still timeout every step\n\nCross bounded context write?\n  YES → Avoid shared DB; saga/outbox; NOT 2PC\n  NO  → Local TX + optional domain event\n\nIndependent deploy between teams?\n  YES → Pact/SCC + Problem Details + versioned API/event schema\n  NO  → Monorepo integration tests supplement not replace contracts\n\n── Spring Boot 3 defaults checklist ──\n  □ RestClient HttpClient timeouts set\n  □ Feign retry disabled or idempotent only\n  □ Resilience4j CB + bulkhead on outbound sync\n  □ OTel propagation RestClient + Kafka\n  □ Little's Law pool sizing validated load test\n  □ ProblemDetail @ControllerAdvice\n  □ Outbox for DB→Kafka\n";

export const FRAMEWORK_TRICKS_OLD = "\nTRICKS-OLD — Microservice Communication Mnemonic (expanded)\n═══════════════════════════════════════════════════════════\nT — Timeout\n    Every sync RestClient/Feign/WebClient/gRPC: connect + read/deadline.\n    Shorter than caller and gateway. No infinite RestTemplate legacy.\n\nR — Retry (careful)\n    Idempotent operations only. Max 2–3 with full jitter.\n    ONE layer owns retry (not Feign + Gateway + mobile).\n    POST requires Idempotency-Key — never blind retry charge.\n\nI — Idempotency\n    Header + server dedup store UNIQUE(business_key).\n    Kafka consumers: idempotent side effect before offset commit.\n\nC — Circuit breaker\n    Fail fast when dependency sick. Half-open probes.\n    Pair with timeout — not replacement. Fail-open vs closed = product call.\n\nK — Kafka / async when fit\n    Fan-out, integration, reconcile, notify — NOT user waiting path.\n    Transactional outbox bridges sync write. Schema Registry compatibility.\n\nS — Security\n    TLS edge; mTLS service-to-service; OAuth2 JWT validated at gateway.\n    Token exchange downstream; no PAN/PII in logs or Kafka headers.\n\nO — Observability\n    RED metrics per endpoint. OpenTelemetry W3C trace across HTTP and Kafka.\n    TraceId in Problem Details. Tail sampling on errors.\n\nF — Failure / cascade\n    Little's Law: concurrency ≈ RPS × latency. Retry storm = metastable failure.\n    Shed load (429/CB) to recover. Bulkhead isolates blast radius.\n\nL — Load balancing + pools\n    Spring Cloud LoadBalancer / K8s Service. Size connection pools from math.\n    SNAT limits; HTTP/2 multiplex; max connection lifetime after deploy.\n\nD — Discovery + DNS\n    Prefer K8s DNS / Spring Cloud K8s over stale Eureka.\n    DNS TTL + keep-alive causes dead pod connections — set max life.\n\nUse TRICKS-OLD in every interview answer for sync dependency design.\n";

export const COVERAGE_CHECKLIST: string[] = [
  "Sync vs async decision per user journey step",
  "RestClient Spring Boot 3 + HttpClient timeouts",
  "RestTemplate legacy migration",
  "WebClient parallel fetch + pool sizing",
  "OpenFeign timeout retry ErrorDecoder config",
  "gRPC deadline propagation Java stub",
  "GraphQL N+1 batch DataLoader",
  "Kafka outbox transactional pattern",
  "Inbox idempotent consumer dedupe",
  "Saga orchestration vs choreography",
  "Compensation idempotent audit",
  "Idempotency-Key HTTP header store",
  "Circuit breaker Resilience4j states",
  "Bulkhead thread/semaphore isolation",
  "Retry jitter single owner",
  "Timeout hierarchy gateway BFF client",
  "Little's Law pool sizing p99",
  "Metastable failure retry amplification",
  "Cascading failure load shed recovery",
  "Payment sync auth async settlement",
  "E-commerce checkout saga OrderPlaced",
  "Banking CP ledger async AML",
  "Trading sync order async market data",
  "BFF anti-pattern serial chain",
  "Chatty sync chain cap 3 hops",
  "Kafka everything anti-pattern",
  "Shared database anti-pattern",
  "No timeout anti-pattern",
  "Retry storm POST anti-pattern",
  "Request-reply Kafka anti-pattern",
  "mTLS mesh Istio Linkerd STRICT",
  "TLS cert rotation cert-manager",
  "OAuth2 JWT resource server gateway",
  "Token exchange audience binding",
  "JWT not in Kafka logs",
  "Problem Details RFC 9457 Spring",
  "Pact consumer-driven contracts CI",
  "Spring Cloud Contract stubs",
  "Schema Registry BACKWARD compat",
  "API versioning Accept header /v2",
  "Expand-contract migration",
  "RED metrics rate errors duration",
  "OpenTelemetry W3C tracecontext",
  "Kafka trace header propagation",
  "Micrometer @Observed spans",
  "Virtual threads Tomcat Boot 3 pinning",
  "Graceful shutdown PreStop drain",
  "Liveness vs readiness probes",
  "Health check shallow liveness",
  "503 overload vs 504 gateway timeout",
  "429 Retry-After honor",
  "502 bad gateway deploy drain",
  "DNS stale K8s endpoints cache",
  "Keep-alive dead pod connection",
  "SNAT port exhaustion egress",
  "Feign logger PCI leak",
  "Connection pool exhausted WebClient",
  "Consumer lag partition scale bound",
  "Hot partition key skew",
  "Rebalance max.poll.interval GC",
  "DLQ poison message handling",
  "Webhook HMAC idempotent event_id",
  "Cross-region sync latency locality",
  "Service discovery K8s vs Eureka",
  "Spring Cloud LoadBalancer hint",
  "API Gateway filter order retry",
  "Istio VirtualService retry budget",
  "Rate limiting gateway token bucket",
  "CQRS projection async update",
  "Event notification vs event-carried state",
  "Dual write vs outbox",
  "Exactly-once end-to-end idempotency scope",
  "Hedged requests load doubling",
  "Game day comm failure runbook",
  "Incident: timeout cascade thread dump",
  "Incident: Feign double charge",
  "Incident: cert expiry mTLS",
  "Incident: schema incompatible deploy",
  "Scenario choose sync vs async 40+",
  "TRICKS-OLD mnemonic expanded",
  "SENIOR vs STAFF answer depth",
  "CHEAT sheet terms traps",
  "DECISION_ASCII tree spoken",
  "SPOKEN 30s 2m 5m staff",
  "Java 21 Spring Boot 3 accuracy",
  "Related hubs resilience4j kafka gateway oauth"
];

export const MEMORY_RULES = [
  {
    "title": "User waits → sync",
    "rule": "REST/gRPC with timeout; async only after commit"
  },
  {
    "title": "Fan-out → Kafka",
    "rule": "Outbox publish; never sync loop N subscribers"
  },
  {
    "title": "Little's Law",
    "rule": "Pool size ≈ peak RPS × p99 latency seconds + headroom"
  },
  {
    "title": "One retry owner",
    "rule": "Not Feign + gateway + client together"
  },
  {
    "title": "POST idempotency",
    "rule": "Idempotency-Key + UNIQUE constraint before retry talk"
  },
  {
    "title": "CB + timeout",
    "rule": "Circuit breaker never replaces explicit timeout"
  },
  {
    "title": "Trace propagation",
    "rule": "OTel W3C through RestClient and Kafka headers"
  },
  {
    "title": "JWT audience",
    "rule": "Exchange token service-to-service; don't blind forward"
  },
  {
    "title": "Problem Details",
    "rule": "RFC 9457 + traceId; safe detail no stack"
  },
  {
    "title": "Contract gate",
    "rule": "Pact/SCC/Schema Registry blocks breaking deploy"
  },
  {
    "title": "503 recovery",
    "rule": "Shed retries and load — metastable needs load drop"
  },
  {
    "title": "DNS + keep-alive",
    "rule": "Max connection lifetime after rollouts"
  },
  {
    "title": "Partition scale",
    "rule": "Kafka consumers ≤ partitions; fix hot keys"
  },
  {
    "title": "Auth sync settle async",
    "rule": "Payment pattern for most money flows"
  },
  {
    "title": "TRICKS-OLD",
    "rule": "Timeout Retry Idempotency CB Kafka Security Observability Failure Load Discovery"
  }
];

const _unique = new Map<string, InterviewQ>();
for (const q of [...TRICK_QS, ...RAPID_QS]) {
  _unique.set(q.id, q);
}

export const SENIOR: InterviewQ[] = [
  {
    "id": "trick-0",
    "topic": "RestClient vs RestTemplate",
    "level": "staff",
    "question": "Trick: \"RestClient vs RestTemplate\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying RestClient vs RestTemplate — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For RestClient vs RestTemplate, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does RestClient vs RestTemplate break at scale?",
      "Production metric for RestClient vs RestTemplate?"
    ],
    "trick": "Retry all HTTP errors including 400.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-2",
    "topic": "OpenFeign defaults",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"OpenFeign defaults\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for OpenFeign defaults.",
    "answer2m": "Staff answer for OpenFeign defaults: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for OpenFeign defaults?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-4",
    "topic": "Kafka request-reply",
    "level": "senior",
    "question": "Staff trap on Kafka request-reply: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Kafka request-reply — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Kafka request-reply with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Kafka request-reply?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-5",
    "topic": "Sync vs async choice",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"Sync vs async choice\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Sync vs async choice.",
    "answer2m": "Staff answer for Sync vs async choice: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Sync vs async choice?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-6",
    "topic": "Timeout hierarchy",
    "level": "senior",
    "question": "Trick: \"Timeout hierarchy\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Timeout hierarchy — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Timeout hierarchy, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Timeout hierarchy break at scale?",
      "Production metric for Timeout hierarchy?"
    ],
    "trick": "Feign default retry is safe for POST payments.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-8",
    "topic": "Circuit breaker half-open",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Circuit breaker half-open\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Circuit breaker half-open.",
    "answer2m": "Staff answer for Circuit breaker half-open: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Circuit breaker half-open?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-10",
    "topic": "Idempotency-Key header",
    "level": "staff",
    "question": "Staff trap on Idempotency-Key header: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Idempotency-Key header — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Idempotency-Key header with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Idempotency-Key header?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-12",
    "topic": "Saga orchestration",
    "level": "senior",
    "question": "Trick: \"Saga orchestration\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Saga orchestration — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Saga orchestration, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Saga orchestration break at scale?",
      "Production metric for Saga orchestration?"
    ],
    "trick": "503 means client should retry immediately without backoff.",
    "wrongAnswer": "mTLS terminates need for application auth."
  },
  {
    "id": "trick-14",
    "topic": "Service discovery Eureka",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Service discovery Eureka\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Service discovery Eureka.",
    "answer2m": "Staff answer for Service discovery Eureka: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Service discovery Eureka?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "RestTemplate is recommended for new Spring Boot 3 services."
  },
  {
    "id": "trick-15",
    "topic": "Kubernetes DNS",
    "level": "staff",
    "question": "Trick: \"Kubernetes DNS\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Kubernetes DNS — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Kubernetes DNS, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Kubernetes DNS break at scale?",
      "Production metric for Kubernetes DNS?"
    ],
    "trick": "Problem Details are optional niceties only.",
    "wrongAnswer": "Kafka gives exactly-once end-to-end by default."
  },
  {
    "id": "trick-16",
    "topic": "Spring Cloud LoadBalancer",
    "level": "senior",
    "question": "Staff trap on Spring Cloud LoadBalancer: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Spring Cloud LoadBalancer — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Spring Cloud LoadBalancer with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Spring Cloud LoadBalancer?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "No timeout needed for internal service calls."
  },
  {
    "id": "trick-18",
    "topic": "BFF aggregation",
    "level": "senior",
    "question": "Trick: \"BFF aggregation\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying BFF aggregation — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For BFF aggregation, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does BFF aggregation break at scale?",
      "Production metric for BFF aggregation?"
    ],
    "trick": "Consumer lag zero required for all Kafka topics.",
    "wrongAnswer": "Forward user JWT to every downstream without audience check."
  },
  {
    "id": "trick-20",
    "topic": "JWT propagation",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"JWT propagation\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for JWT propagation.",
    "answer2m": "Staff answer for JWT propagation: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for JWT propagation?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-22",
    "topic": "Problem Details RFC 9457",
    "level": "senior",
    "question": "Staff trap on Problem Details RFC 9457: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Problem Details RFC 9457 — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Problem Details RFC 9457 with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Problem Details RFC 9457?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-24",
    "topic": "Spring Cloud Contract",
    "level": "senior",
    "question": "Trick: \"Spring Cloud Contract\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Spring Cloud Contract — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Spring Cloud Contract, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Spring Cloud Contract break at scale?",
      "Production metric for Spring Cloud Contract?"
    ],
    "trick": "Circuit breaker replaces timeout configuration.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-25",
    "topic": "Schema Registry compatibility",
    "level": "staff",
    "question": "Staff trap on Schema Registry compatibility: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Schema Registry compatibility — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Schema Registry compatibility with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Schema Registry compatibility?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-26",
    "topic": "Little's Law sizing",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Little's Law sizing\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Little's Law sizing.",
    "answer2m": "Staff answer for Little's Law sizing: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Little's Law sizing?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-28",
    "topic": "DNS caching stale",
    "level": "senior",
    "question": "Staff trap on DNS caching stale: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on DNS caching stale — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix DNS caching stale with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for DNS caching stale?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-30",
    "topic": "Keep-alive pitfalls",
    "level": "staff",
    "question": "Trick: \"Keep-alive pitfalls\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Keep-alive pitfalls — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Keep-alive pitfalls, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Keep-alive pitfalls break at scale?",
      "Production metric for Keep-alive pitfalls?"
    ],
    "trick": "Shared database is fine with microservices if teams coordinate.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-32",
    "topic": "Health check vs readiness",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Health check vs readiness\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Health check vs readiness.",
    "answer2m": "Staff answer for Health check vs readiness: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Health check vs readiness?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "mTLS terminates need for application auth."
  },
  {
    "id": "trick-34",
    "topic": "Kafka header trace",
    "level": "senior",
    "question": "Staff trap on Kafka header trace: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Kafka header trace — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Kafka header trace with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Kafka header trace?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "RestTemplate is recommended for new Spring Boot 3 services."
  },
  {
    "id": "trick-35",
    "topic": "429 Retry-After",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"429 Retry-After\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for 429 Retry-After.",
    "answer2m": "Staff answer for 429 Retry-After: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for 429 Retry-After?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Kafka gives exactly-once end-to-end by default."
  },
  {
    "id": "trick-36",
    "topic": "503 vs 504 gateway",
    "level": "senior",
    "question": "Trick: \"503 vs 504 gateway\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying 503 vs 504 gateway — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For 503 vs 504 gateway, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does 503 vs 504 gateway break at scale?",
      "Production metric for 503 vs 504 gateway?"
    ],
    "trick": "Contract tests replace integration tests entirely.",
    "wrongAnswer": "No timeout needed for internal service calls."
  },
  {
    "id": "trick-38",
    "topic": "Resilience4j config",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Resilience4j config\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Resilience4j config.",
    "answer2m": "Staff answer for Resilience4j config: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Resilience4j config?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Forward user JWT to every downstream without audience check."
  },
  {
    "id": "trick-40",
    "topic": "Structured concurrency",
    "level": "staff",
    "question": "Staff trap on Structured concurrency: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Structured concurrency — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Structured concurrency with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Structured concurrency?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-42",
    "topic": "Exactly-once myth",
    "level": "senior",
    "question": "Trick: \"Exactly-once myth\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Exactly-once myth — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Exactly-once myth, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Exactly-once myth break at scale?",
      "Production metric for Exactly-once myth?"
    ],
    "trick": "Kafka gives exactly-once end-to-end by default.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-44",
    "topic": "CQRS read model sync",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"CQRS read model sync\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for CQRS read model sync.",
    "answer2m": "Staff answer for CQRS read model sync: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for CQRS read model sync?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-45",
    "topic": "GraphQL N+1 downstream",
    "level": "staff",
    "question": "Trick: \"GraphQL N+1 downstream\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying GraphQL N+1 downstream — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For GraphQL N+1 downstream, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does GraphQL N+1 downstream break at scale?",
      "Production metric for GraphQL N+1 downstream?"
    ],
    "trick": "Forward user JWT to every downstream without audience check.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-46",
    "topic": "Service mesh sidecar latency",
    "level": "senior",
    "question": "Staff trap on Service mesh sidecar latency: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Service mesh sidecar latency — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Service mesh sidecar latency with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Service mesh sidecar latency?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-48",
    "topic": "Canary traffic split",
    "level": "senior",
    "question": "Trick: \"Canary traffic split\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Canary traffic split — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Canary traffic split, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Canary traffic split break at scale?",
      "Production metric for Canary traffic split?"
    ],
    "trick": "gRPC is always better than REST for browser clients.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-50",
    "topic": "Webhook delivery retry",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"Webhook delivery retry\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Webhook delivery retry.",
    "answer2m": "Staff answer for Webhook delivery retry: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Webhook delivery retry?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-52",
    "topic": "Long polling anti-pattern",
    "level": "senior",
    "question": "Staff trap on Long polling anti-pattern: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Long polling anti-pattern — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Long polling anti-pattern with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Long polling anti-pattern?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "mTLS terminates need for application auth."
  },
  {
    "id": "trick-54",
    "topic": "Rate limiter client vs server",
    "level": "senior",
    "question": "Trick: \"Rate limiter client vs server\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Rate limiter client vs server — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Rate limiter client vs server, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Rate limiter client vs server break at scale?",
      "Production metric for Rate limiter client vs server?"
    ],
    "trick": "DNS never causes intermittent 503 in Kubernetes.",
    "wrongAnswer": "RestTemplate is recommended for new Spring Boot 3 services."
  },
  {
    "id": "trick-55",
    "topic": "Hedged requests",
    "level": "staff",
    "question": "Staff trap on Hedged requests: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Hedged requests — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Hedged requests with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Hedged requests?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Kafka gives exactly-once end-to-end by default."
  },
  {
    "id": "trick-56",
    "topic": "Backup request pattern",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Backup request pattern\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Backup request pattern.",
    "answer2m": "Staff answer for Backup request pattern: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Backup request pattern?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "No timeout needed for internal service calls."
  },
  {
    "id": "trick-58",
    "topic": "Strangler fig migration",
    "level": "senior",
    "question": "Staff trap on Strangler fig migration: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Strangler fig migration — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Strangler fig migration with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Strangler fig migration?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Forward user JWT to every downstream without audience check."
  },
  {
    "id": "trick-60",
    "topic": "Shared cache invalidation",
    "level": "staff",
    "question": "Trick: \"Shared cache invalidation\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Shared cache invalidation — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Shared cache invalidation, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Shared cache invalidation break at scale?",
      "Production metric for Shared cache invalidation?"
    ],
    "trick": "Retry all HTTP errors including 400.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-62",
    "topic": "gRPC deadline propagation",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"gRPC deadline propagation\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for gRPC deadline propagation.",
    "answer2m": "Staff answer for gRPC deadline propagation: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for gRPC deadline propagation?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-64",
    "topic": "OpenAPI codegen drift",
    "level": "senior",
    "question": "Staff trap on OpenAPI codegen drift: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on OpenAPI codegen drift — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix OpenAPI codegen drift with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for OpenAPI codegen drift?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-65",
    "topic": "Spring 6 HttpInterface",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"Spring 6 HttpInterface\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Spring 6 HttpInterface.",
    "answer2m": "Staff answer for Spring 6 HttpInterface: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Spring 6 HttpInterface?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-66",
    "topic": "Reactive blocking call",
    "level": "senior",
    "question": "Trick: \"Reactive blocking call\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Reactive blocking call — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Reactive blocking call, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Reactive blocking call break at scale?",
      "Production metric for Reactive blocking call?"
    ],
    "trick": "Feign default retry is safe for POST payments.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-68",
    "topic": "Async @Async self-invocation",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Async @Async self-invocation\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Async @Async self-invocation.",
    "answer2m": "Staff answer for Async @Async self-invocation: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Async @Async self-invocation?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-70",
    "topic": "Static membership Kafka",
    "level": "staff",
    "question": "Staff trap on Static membership Kafka: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Static membership Kafka — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Static membership Kafka with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Static membership Kafka?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "rapid-0",
    "topic": "RestClient",
    "level": "staff",
    "question": "Quick: one-line rule for RestClient in microservice communication?",
    "answer30s": "RestClient: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand RestClient with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "RestClient config knob?",
      "RestClient production alert?"
    ]
  },
  {
    "id": "rapid-3",
    "topic": "gRPC",
    "level": "senior",
    "question": "Quick: one-line rule for gRPC in microservice communication?",
    "answer30s": "gRPC: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand gRPC with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "gRPC config knob?",
      "gRPC production alert?"
    ]
  },
  {
    "id": "rapid-6",
    "topic": "Kafka consume",
    "level": "senior",
    "question": "Quick: one-line rule for Kafka consume in microservice communication?",
    "answer30s": "Kafka consume: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Kafka consume with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Kafka consume config knob?",
      "Kafka consume production alert?"
    ]
  },
  {
    "id": "rapid-7",
    "topic": "Outbox",
    "level": "staff",
    "question": "Quick: one-line rule for Outbox in microservice communication?",
    "answer30s": "Outbox: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Outbox with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Outbox config knob?",
      "Outbox production alert?"
    ]
  },
  {
    "id": "rapid-9",
    "topic": "Timeout",
    "level": "senior",
    "question": "Quick: one-line rule for Timeout in microservice communication?",
    "answer30s": "Timeout: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Timeout with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Timeout config knob?",
      "Timeout production alert?"
    ]
  },
  {
    "id": "rapid-12",
    "topic": "Bulkhead",
    "level": "senior",
    "question": "Quick: one-line rule for Bulkhead in microservice communication?",
    "answer30s": "Bulkhead: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Bulkhead with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Bulkhead config knob?",
      "Bulkhead production alert?"
    ]
  },
  {
    "id": "rapid-14",
    "topic": "Load balancer",
    "level": "staff",
    "question": "Quick: one-line rule for Load balancer in microservice communication?",
    "answer30s": "Load balancer: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Load balancer with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Load balancer config knob?",
      "Load balancer production alert?"
    ]
  },
  {
    "id": "rapid-15",
    "topic": "Service discovery",
    "level": "senior",
    "question": "Quick: one-line rule for Service discovery in microservice communication?",
    "answer30s": "Service discovery: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Service discovery with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Service discovery config knob?",
      "Service discovery production alert?"
    ]
  },
  {
    "id": "rapid-18",
    "topic": "mTLS",
    "level": "senior",
    "question": "Quick: one-line rule for mTLS in microservice communication?",
    "answer30s": "mTLS: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand mTLS with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "mTLS config knob?",
      "mTLS production alert?"
    ]
  },
  {
    "id": "rapid-21",
    "topic": "Problem Details",
    "level": "staff",
    "question": "Quick: one-line rule for Problem Details in microservice communication?",
    "answer30s": "Problem Details: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Problem Details with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Problem Details config knob?",
      "Problem Details production alert?"
    ]
  },
  {
    "id": "rapid-24",
    "topic": "Connection pool",
    "level": "senior",
    "question": "Quick: one-line rule for Connection pool in microservice communication?",
    "answer30s": "Connection pool: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Connection pool with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Connection pool config knob?",
      "Connection pool production alert?"
    ]
  },
  {
    "id": "rapid-27",
    "topic": "Readiness",
    "level": "senior",
    "question": "Quick: one-line rule for Readiness in microservice communication?",
    "answer30s": "Readiness: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Readiness with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Readiness config knob?",
      "Readiness production alert?"
    ]
  },
  {
    "id": "rapid-28",
    "topic": "Tracing",
    "level": "staff",
    "question": "Quick: one-line rule for Tracing in microservice communication?",
    "answer30s": "Tracing: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Tracing with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Tracing config knob?",
      "Tracing production alert?"
    ]
  },
  {
    "id": "rapid-30",
    "topic": "Virtual threads",
    "level": "senior",
    "question": "Quick: one-line rule for Virtual threads in microservice communication?",
    "answer30s": "Virtual threads: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Virtual threads with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Virtual threads config knob?",
      "Virtual threads production alert?"
    ]
  },
  {
    "id": "rapid-33",
    "topic": "Schema Registry",
    "level": "senior",
    "question": "Quick: one-line rule for Schema Registry in microservice communication?",
    "answer30s": "Schema Registry: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Schema Registry with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Schema Registry config knob?",
      "Schema Registry production alert?"
    ]
  },
  {
    "id": "rapid-35",
    "topic": "Sidecar mesh",
    "level": "staff",
    "question": "Quick: one-line rule for Sidecar mesh in microservice communication?",
    "answer30s": "Sidecar mesh: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Sidecar mesh with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Sidecar mesh config knob?",
      "Sidecar mesh production alert?"
    ]
  },
  {
    "id": "rapid-36",
    "topic": "Canary",
    "level": "senior",
    "question": "Quick: one-line rule for Canary in microservice communication?",
    "answer30s": "Canary: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Canary with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Canary config knob?",
      "Canary production alert?"
    ]
  },
  {
    "id": "rapid-39",
    "topic": "SSE",
    "level": "senior",
    "question": "Quick: one-line rule for SSE in microservice communication?",
    "answer30s": "SSE: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand SSE with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "SSE config knob?",
      "SSE production alert?"
    ]
  },
  {
    "id": "rapid-42",
    "topic": "Event notification",
    "level": "staff",
    "question": "Quick: one-line rule for Event notification in microservice communication?",
    "answer30s": "Event notification: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Event notification with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Event notification config knob?",
      "Event notification production alert?"
    ]
  },
  {
    "id": "rapid-45",
    "topic": "Feign decoder",
    "level": "senior",
    "question": "Quick: one-line rule for Feign decoder in microservice communication?",
    "answer30s": "Feign decoder: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Feign decoder with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Feign decoder config knob?",
      "Feign decoder production alert?"
    ]
  },
  {
    "id": "rapid-48",
    "topic": "Compression",
    "level": "senior",
    "question": "Quick: one-line rule for Compression in microservice communication?",
    "answer30s": "Compression: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Compression with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Compression config knob?",
      "Compression production alert?"
    ]
  },
  {
    "id": "rapid-49",
    "topic": "Avro",
    "level": "staff",
    "question": "Quick: one-line rule for Avro in microservice communication?",
    "answer30s": "Avro: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Avro with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Avro config knob?",
      "Avro production alert?"
    ]
  },
  {
    "id": "rapid-51",
    "topic": "SPIFFE",
    "level": "senior",
    "question": "Quick: one-line rule for SPIFFE in microservice communication?",
    "answer30s": "SPIFFE: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand SPIFFE with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "SPIFFE config knob?",
      "SPIFFE production alert?"
    ]
  },
  {
    "id": "rapid-54",
    "topic": "Client credentials",
    "level": "senior",
    "question": "Quick: one-line rule for Client credentials in microservice communication?",
    "answer30s": "Client credentials: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Client credentials with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Client credentials config knob?",
      "Client credentials production alert?"
    ]
  }
];

export const ARCHITECT: InterviewQ[] = [
  {
    "id": "trick-0",
    "topic": "RestClient vs RestTemplate",
    "level": "staff",
    "question": "Trick: \"RestClient vs RestTemplate\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying RestClient vs RestTemplate — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For RestClient vs RestTemplate, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does RestClient vs RestTemplate break at scale?",
      "Production metric for RestClient vs RestTemplate?"
    ],
    "trick": "Retry all HTTP errors including 400.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-5",
    "topic": "Sync vs async choice",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"Sync vs async choice\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Sync vs async choice.",
    "answer2m": "Staff answer for Sync vs async choice: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Sync vs async choice?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-10",
    "topic": "Idempotency-Key header",
    "level": "staff",
    "question": "Staff trap on Idempotency-Key header: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Idempotency-Key header — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Idempotency-Key header with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Idempotency-Key header?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-15",
    "topic": "Kubernetes DNS",
    "level": "staff",
    "question": "Trick: \"Kubernetes DNS\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Kubernetes DNS — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Kubernetes DNS, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Kubernetes DNS break at scale?",
      "Production metric for Kubernetes DNS?"
    ],
    "trick": "Problem Details are optional niceties only.",
    "wrongAnswer": "Kafka gives exactly-once end-to-end by default."
  },
  {
    "id": "trick-20",
    "topic": "JWT propagation",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"JWT propagation\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for JWT propagation.",
    "answer2m": "Staff answer for JWT propagation: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for JWT propagation?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-25",
    "topic": "Schema Registry compatibility",
    "level": "staff",
    "question": "Staff trap on Schema Registry compatibility: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Schema Registry compatibility — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Schema Registry compatibility with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Schema Registry compatibility?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-30",
    "topic": "Keep-alive pitfalls",
    "level": "staff",
    "question": "Trick: \"Keep-alive pitfalls\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Keep-alive pitfalls — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Keep-alive pitfalls, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Keep-alive pitfalls break at scale?",
      "Production metric for Keep-alive pitfalls?"
    ],
    "trick": "Shared database is fine with microservices if teams coordinate.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-35",
    "topic": "429 Retry-After",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"429 Retry-After\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for 429 Retry-After.",
    "answer2m": "Staff answer for 429 Retry-After: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for 429 Retry-After?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Kafka gives exactly-once end-to-end by default."
  },
  {
    "id": "trick-40",
    "topic": "Structured concurrency",
    "level": "staff",
    "question": "Staff trap on Structured concurrency: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Structured concurrency — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Structured concurrency with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Structured concurrency?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-45",
    "topic": "GraphQL N+1 downstream",
    "level": "staff",
    "question": "Trick: \"GraphQL N+1 downstream\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying GraphQL N+1 downstream — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For GraphQL N+1 downstream, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does GraphQL N+1 downstream break at scale?",
      "Production metric for GraphQL N+1 downstream?"
    ],
    "trick": "Forward user JWT to every downstream without audience check.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-50",
    "topic": "Webhook delivery retry",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"Webhook delivery retry\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Webhook delivery retry.",
    "answer2m": "Staff answer for Webhook delivery retry: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Webhook delivery retry?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-55",
    "topic": "Hedged requests",
    "level": "staff",
    "question": "Staff trap on Hedged requests: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Hedged requests — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Hedged requests with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Hedged requests?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Kafka gives exactly-once end-to-end by default."
  },
  {
    "id": "trick-60",
    "topic": "Shared cache invalidation",
    "level": "staff",
    "question": "Trick: \"Shared cache invalidation\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Shared cache invalidation — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Shared cache invalidation, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Shared cache invalidation break at scale?",
      "Production metric for Shared cache invalidation?"
    ],
    "trick": "Retry all HTTP errors including 400.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-65",
    "topic": "Spring 6 HttpInterface",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"Spring 6 HttpInterface\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Spring 6 HttpInterface.",
    "answer2m": "Staff answer for Spring 6 HttpInterface: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Spring 6 HttpInterface?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "503 means client should retry immediately without backoff."
  },
  {
    "id": "trick-70",
    "topic": "Static membership Kafka",
    "level": "staff",
    "question": "Staff trap on Static membership Kafka: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Static membership Kafka — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Static membership Kafka with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Static membership Kafka?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "rapid-0",
    "topic": "RestClient",
    "level": "staff",
    "question": "Quick: one-line rule for RestClient in microservice communication?",
    "answer30s": "RestClient: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand RestClient with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "RestClient config knob?",
      "RestClient production alert?"
    ]
  },
  {
    "id": "rapid-7",
    "topic": "Outbox",
    "level": "staff",
    "question": "Quick: one-line rule for Outbox in microservice communication?",
    "answer30s": "Outbox: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Outbox with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Outbox config knob?",
      "Outbox production alert?"
    ]
  },
  {
    "id": "rapid-14",
    "topic": "Load balancer",
    "level": "staff",
    "question": "Quick: one-line rule for Load balancer in microservice communication?",
    "answer30s": "Load balancer: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Load balancer with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Load balancer config knob?",
      "Load balancer production alert?"
    ]
  },
  {
    "id": "rapid-21",
    "topic": "Problem Details",
    "level": "staff",
    "question": "Quick: one-line rule for Problem Details in microservice communication?",
    "answer30s": "Problem Details: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Problem Details with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Problem Details config knob?",
      "Problem Details production alert?"
    ]
  },
  {
    "id": "rapid-28",
    "topic": "Tracing",
    "level": "staff",
    "question": "Quick: one-line rule for Tracing in microservice communication?",
    "answer30s": "Tracing: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Tracing with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Tracing config knob?",
      "Tracing production alert?"
    ]
  },
  {
    "id": "rapid-35",
    "topic": "Sidecar mesh",
    "level": "staff",
    "question": "Quick: one-line rule for Sidecar mesh in microservice communication?",
    "answer30s": "Sidecar mesh: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Sidecar mesh with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Sidecar mesh config knob?",
      "Sidecar mesh production alert?"
    ]
  },
  {
    "id": "rapid-42",
    "topic": "Event notification",
    "level": "staff",
    "question": "Quick: one-line rule for Event notification in microservice communication?",
    "answer30s": "Event notification: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Event notification with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Event notification config knob?",
      "Event notification production alert?"
    ]
  },
  {
    "id": "rapid-49",
    "topic": "Avro",
    "level": "staff",
    "question": "Quick: one-line rule for Avro in microservice communication?",
    "answer30s": "Avro: default rule — sync only when caller needs answer now; always timeout + idempotency on mutations; async fan-out via Kafka/outbox when SLO allows.",
    "answer2m": "Expand Avro with Spring Boot 3 hook (RestClient/Resilience4j/@KafkaListener), failure signal (metric/log), and one anti-pattern. State trade-off in one sentence.",
    "followUps": [
      "Avro config knob?",
      "Avro production alert?"
    ]
  },
  {
    "id": "trick-0",
    "topic": "RestClient vs RestTemplate",
    "level": "staff",
    "question": "Trick: \"RestClient vs RestTemplate\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying RestClient vs RestTemplate — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For RestClient vs RestTemplate, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does RestClient vs RestTemplate break at scale?",
      "Production metric for RestClient vs RestTemplate?"
    ],
    "trick": "Retry all HTTP errors including 400.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-2",
    "topic": "OpenFeign defaults",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"OpenFeign defaults\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for OpenFeign defaults.",
    "answer2m": "Staff answer for OpenFeign defaults: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for OpenFeign defaults?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-4",
    "topic": "Kafka request-reply",
    "level": "senior",
    "question": "Staff trap on Kafka request-reply: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Kafka request-reply — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Kafka request-reply with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Kafka request-reply?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-6",
    "topic": "Timeout hierarchy",
    "level": "senior",
    "question": "Trick: \"Timeout hierarchy\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Timeout hierarchy — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Timeout hierarchy, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Timeout hierarchy break at scale?",
      "Production metric for Timeout hierarchy?"
    ],
    "trick": "Feign default retry is safe for POST payments.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-8",
    "topic": "Circuit breaker half-open",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Circuit breaker half-open\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Circuit breaker half-open.",
    "answer2m": "Staff answer for Circuit breaker half-open: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Circuit breaker half-open?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-10",
    "topic": "Idempotency-Key header",
    "level": "staff",
    "question": "Staff trap on Idempotency-Key header: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Idempotency-Key header — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Idempotency-Key header with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Idempotency-Key header?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-12",
    "topic": "Saga orchestration",
    "level": "senior",
    "question": "Trick: \"Saga orchestration\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Saga orchestration — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Saga orchestration, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Saga orchestration break at scale?",
      "Production metric for Saga orchestration?"
    ],
    "trick": "503 means client should retry immediately without backoff.",
    "wrongAnswer": "mTLS terminates need for application auth."
  },
  {
    "id": "trick-14",
    "topic": "Service discovery Eureka",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Service discovery Eureka\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Service discovery Eureka.",
    "answer2m": "Staff answer for Service discovery Eureka: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Service discovery Eureka?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "RestTemplate is recommended for new Spring Boot 3 services."
  },
  {
    "id": "trick-16",
    "topic": "Spring Cloud LoadBalancer",
    "level": "senior",
    "question": "Staff trap on Spring Cloud LoadBalancer: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Spring Cloud LoadBalancer — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Spring Cloud LoadBalancer with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Spring Cloud LoadBalancer?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "No timeout needed for internal service calls."
  },
  {
    "id": "trick-18",
    "topic": "BFF aggregation",
    "level": "senior",
    "question": "Trick: \"BFF aggregation\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying BFF aggregation — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For BFF aggregation, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does BFF aggregation break at scale?",
      "Production metric for BFF aggregation?"
    ],
    "trick": "Consumer lag zero required for all Kafka topics.",
    "wrongAnswer": "Forward user JWT to every downstream without audience check."
  },
  {
    "id": "trick-20",
    "topic": "JWT propagation",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"JWT propagation\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for JWT propagation.",
    "answer2m": "Staff answer for JWT propagation: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for JWT propagation?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-22",
    "topic": "Problem Details RFC 9457",
    "level": "senior",
    "question": "Staff trap on Problem Details RFC 9457: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Problem Details RFC 9457 — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Problem Details RFC 9457 with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Problem Details RFC 9457?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-24",
    "topic": "Spring Cloud Contract",
    "level": "senior",
    "question": "Trick: \"Spring Cloud Contract\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Spring Cloud Contract — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Spring Cloud Contract, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Spring Cloud Contract break at scale?",
      "Production metric for Spring Cloud Contract?"
    ],
    "trick": "Circuit breaker replaces timeout configuration.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-26",
    "topic": "Little's Law sizing",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Little's Law sizing\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Little's Law sizing.",
    "answer2m": "Staff answer for Little's Law sizing: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Little's Law sizing?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-28",
    "topic": "DNS caching stale",
    "level": "senior",
    "question": "Staff trap on DNS caching stale: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on DNS caching stale — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix DNS caching stale with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for DNS caching stale?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-30",
    "topic": "Keep-alive pitfalls",
    "level": "staff",
    "question": "Trick: \"Keep-alive pitfalls\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Keep-alive pitfalls — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Keep-alive pitfalls, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Keep-alive pitfalls break at scale?",
      "Production metric for Keep-alive pitfalls?"
    ],
    "trick": "Shared database is fine with microservices if teams coordinate.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-32",
    "topic": "Health check vs readiness",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Health check vs readiness\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Health check vs readiness.",
    "answer2m": "Staff answer for Health check vs readiness: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Health check vs readiness?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "mTLS terminates need for application auth."
  },
  {
    "id": "trick-34",
    "topic": "Kafka header trace",
    "level": "senior",
    "question": "Staff trap on Kafka header trace: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Kafka header trace — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Kafka header trace with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Kafka header trace?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "RestTemplate is recommended for new Spring Boot 3 services."
  },
  {
    "id": "trick-36",
    "topic": "503 vs 504 gateway",
    "level": "senior",
    "question": "Trick: \"503 vs 504 gateway\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying 503 vs 504 gateway — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For 503 vs 504 gateway, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does 503 vs 504 gateway break at scale?",
      "Production metric for 503 vs 504 gateway?"
    ],
    "trick": "Contract tests replace integration tests entirely.",
    "wrongAnswer": "No timeout needed for internal service calls."
  },
  {
    "id": "trick-38",
    "topic": "Resilience4j config",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Resilience4j config\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Resilience4j config.",
    "answer2m": "Staff answer for Resilience4j config: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Resilience4j config?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Forward user JWT to every downstream without audience check."
  },
  {
    "id": "trick-40",
    "topic": "Structured concurrency",
    "level": "staff",
    "question": "Staff trap on Structured concurrency: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Structured concurrency — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Structured concurrency with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Structured concurrency?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-42",
    "topic": "Exactly-once myth",
    "level": "senior",
    "question": "Trick: \"Exactly-once myth\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Exactly-once myth — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Exactly-once myth, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Exactly-once myth break at scale?",
      "Production metric for Exactly-once myth?"
    ],
    "trick": "Kafka gives exactly-once end-to-end by default.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-44",
    "topic": "CQRS read model sync",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"CQRS read model sync\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for CQRS read model sync.",
    "answer2m": "Staff answer for CQRS read model sync: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for CQRS read model sync?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-46",
    "topic": "Service mesh sidecar latency",
    "level": "senior",
    "question": "Staff trap on Service mesh sidecar latency: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Service mesh sidecar latency — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Service mesh sidecar latency with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Service mesh sidecar latency?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-48",
    "topic": "Canary traffic split",
    "level": "senior",
    "question": "Trick: \"Canary traffic split\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Canary traffic split — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Canary traffic split, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Canary traffic split break at scale?",
      "Production metric for Canary traffic split?"
    ],
    "trick": "gRPC is always better than REST for browser clients.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-50",
    "topic": "Webhook delivery retry",
    "level": "staff",
    "question": "Compare junior vs staff answer for \"Webhook delivery retry\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Webhook delivery retry.",
    "answer2m": "Staff answer for Webhook delivery retry: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Webhook delivery retry?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  },
  {
    "id": "trick-52",
    "topic": "Long polling anti-pattern",
    "level": "senior",
    "question": "Staff trap on Long polling anti-pattern: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Long polling anti-pattern — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Long polling anti-pattern with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Long polling anti-pattern?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "mTLS terminates need for application auth."
  },
  {
    "id": "trick-54",
    "topic": "Rate limiter client vs server",
    "level": "senior",
    "question": "Trick: \"Rate limiter client vs server\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Rate limiter client vs server — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Rate limiter client vs server, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Rate limiter client vs server break at scale?",
      "Production metric for Rate limiter client vs server?"
    ],
    "trick": "DNS never causes intermittent 503 in Kubernetes.",
    "wrongAnswer": "RestTemplate is recommended for new Spring Boot 3 services."
  },
  {
    "id": "trick-56",
    "topic": "Backup request pattern",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Backup request pattern\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Backup request pattern.",
    "answer2m": "Staff answer for Backup request pattern: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Backup request pattern?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "No timeout needed for internal service calls."
  },
  {
    "id": "trick-58",
    "topic": "Strangler fig migration",
    "level": "senior",
    "question": "Staff trap on Strangler fig migration: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Strangler fig migration — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Strangler fig migration with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Strangler fig migration?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Forward user JWT to every downstream without audience check."
  },
  {
    "id": "trick-60",
    "topic": "Shared cache invalidation",
    "level": "staff",
    "question": "Trick: \"Shared cache invalidation\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Shared cache invalidation — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Shared cache invalidation, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Shared cache invalidation break at scale?",
      "Production metric for Shared cache invalidation?"
    ],
    "trick": "Retry all HTTP errors including 400.",
    "wrongAnswer": "WebClient is always non-blocking so pool size does not matter."
  },
  {
    "id": "trick-62",
    "topic": "gRPC deadline propagation",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"gRPC deadline propagation\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for gRPC deadline propagation.",
    "answer2m": "Staff answer for gRPC deadline propagation: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for gRPC deadline propagation?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Service mesh removes need for application timeouts."
  },
  {
    "id": "trick-64",
    "topic": "OpenAPI codegen drift",
    "level": "senior",
    "question": "Staff trap on OpenAPI codegen drift: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on OpenAPI codegen drift — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix OpenAPI codegen drift with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for OpenAPI codegen drift?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Async everywhere improves user-facing latency."
  },
  {
    "id": "trick-66",
    "topic": "Reactive blocking call",
    "level": "senior",
    "question": "Trick: \"Reactive blocking call\" — what is the first wrong answer interviewers expect?",
    "answer30s": "The trap is oversimplifying Reactive blocking call — state boundary conditions and pair with timeout/idempotency.",
    "answer2m": "For Reactive blocking call, reject one-size-fits-all. Name sync vs async fit, Spring Boot 3 mechanism (RestClient/Resilience4j/Kafka), failure mode, and observability signal proving your choice in prod.",
    "followUps": [
      "When does Reactive blocking call break at scale?",
      "Production metric for Reactive blocking call?"
    ],
    "trick": "Feign default retry is safe for POST payments.",
    "wrongAnswer": "Connection pool max 10 is always enough."
  },
  {
    "id": "trick-68",
    "topic": "Async @Async self-invocation",
    "level": "senior",
    "question": "Compare junior vs staff answer for \"Async @Async self-invocation\".",
    "answer30s": "Junior names tool; staff names invariant, SLO, failure domain, and migration path for Async @Async self-invocation.",
    "answer2m": "Staff answer for Async @Async self-invocation: problem → options → trade-off → default for Java 21 Spring Boot 3 shop → how to verify (metric/trace/contract test) → anti-pattern callout.",
    "followUps": [
      "Document decision ADR for Async @Async self-invocation?",
      "Rollback plan?"
    ],
    "trick": "Staff only adds more buzzwords.",
    "wrongAnswer": "Problem Details are optional niceties only."
  },
  {
    "id": "trick-70",
    "topic": "Static membership Kafka",
    "level": "staff",
    "question": "Staff trap on Static membership Kafka: what config mistake causes production cascade?",
    "answer30s": "Stacked retries/timeouts without bulkhead on Static membership Kafka — effective load exceeds capacity (metastable).",
    "answer2m": "Walk timeline: dependency slow → pool saturated (Little's Law) → retries multiply → recovery blocked. Fix Static membership Kafka with fail-fast CB, capped retry, idempotency, async buffer.",
    "followUps": [
      "Game day test for Static membership Kafka?",
      "Runbook first action?"
    ],
    "trick": "Scale pods fixes cascade without load shed.",
    "wrongAnswer": "Virtual threads eliminate all blocking concerns."
  }
];

export const RAPID: InterviewQ[] = RAPID_QS;

export const ALL: InterviewQ[] = [..._unique.values()];

export const INTERVIEW_EXPORT_COUNTS = {
  "TRICK_QS": 72,
  "RAPID_QS": 56,
  "CHOOSE_QS": 50,
  "INCIDENTS": 49,
  "SENIOR_VS_STAFF": 15,
  "CHEAT_ROWS": 30,
  "COVERAGE_CHECKLIST": 86,
  "MEMORY_RULES": 15,
  "uniqueInterviewQ": 128,
  "SENIOR_alias": 67,
  "ARCHITECT_alias": 59,
  "RAPID_alias": 56,
  "ALL_alias": 128
} as const;

export const EXPORT_COUNTS = {
  ...INTERVIEW_EXPORT_COUNTS,
  DESIGN: DESIGN.length,
} as const;
