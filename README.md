# Vibhu Architect

Production-oriented system design interview preparation by Vibhu Agarwal — built for **Senior → Staff/Principal** interviews (FAANG, high-scale tech, FinTech).

Learn through real-world stories, architecture diagrams, capacity estimates, failure scenarios, trade-offs, and follow-ups — not technology name-dropping.


## Start here

1. [System Design Master Index](https://vibhuagwl.github.io/vibhu-tech-blog/system-design/system-design-master-index/)
2. [30-Day Plan](https://vibhuagwl.github.io/vibhu-tech-blog/system-design/30-day-system-design-plan/) / [60-Day Plan](https://vibhuagwl.github.io/vibhu-tech-blog/system-design/60-day-system-design-plan/)
3. [7-Day Revision](https://vibhuagwl.github.io/vibhu-tech-blog/system-design/7-day-interview-revision/)
4. Section catalogs with left navigation:
   - `/system-design`
   - `/distributed-systems`
   - `/fintech`
   - `/behavior`

## Curriculum pillars

| Pillar | Examples in repo |
|---|---|
| Frameworks | Interview prep, capacity estimation, trade-offs, DB decisions, anti-patterns |
| Building blocks | Load balancer, Redis, Kafka, CDC/outbox, consistent hashing, distributed locking |
| Reliability | Timeouts/retries/circuits, sagas |
| Full designs | URL shortener, rate limiter, KV store, WhatsApp, Instagram, Uber, notifications, payments, counters |
| Behavior | STAR framework, ownership, conflict, leadership |
| Cheat sheets | SQL/NoSQL, Kafka, Redis, scaling, failure, consistency, last-minute |

## Stack

- Next.js 15 + TypeScript + React 19
- Tailwind CSS
- MDX (`content/**`) + gray-matter
- Mermaid diagrams
- Static export → GitHub Pages

## Content workflow

Add `content/<area>/<slug>.mdx` with frontmatter:

```yaml
---
slug: my-topic
title: My Topic
description: SEO blurb.
category: Fundamentals  # or System Design, Caching, Messaging, ...
difficulty: Intermediate
tags: [Interview, HLD]
readingTime: 12 min
publishedAt: "2026-08-14"
---
```

Categories drive Learn filters and left-nav section catalogs.

## Local development

```bash
npm install
npm run dev
npm run build
```

## Structure

```text
app/                 routes (system-design, distributed-systems, fintech, behavior, learn, ...)
components/          problem-nav, article-view, mermaid, catalog-layout
content/             MDX knowledge base
lib/posts.ts         discovery + section category maps
```

## Philosophy

```text
Requirements → Scale → API/Data → Naive design → Bottlenecks
→ Evolve → Deep dive → Failures → Trade-offs → Defense
```

Every major choice should answer **why**, **why not the alternative**, and **what fails**.
