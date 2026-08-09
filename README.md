# System Design Interview Hub

Production-oriented engineering publication by Vibhu Agarwal. Learn system design through real-world stories, architecture diagrams, capacity estimates, failure scenarios, trade-offs and senior/Staff-level interview follow-ups.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- MDX content with frontmatter
- Mermaid diagrams
- Static generation
- GitHub Pages + GitHub Actions
- SEO metadata, sitemap and RSS

## Content workflow

Create a file such as:

`content/system-design/design-whatsapp.mdx`

with frontmatter:

```yaml
---
title: Design WhatsApp
slug: design-whatsapp
description: Design a highly available messaging platform.
category: System Design
difficulty: Advanced
tags: [Messaging, Kafka]
readingTime: 25 min
publishedAt: 2026-08-10
---
```

The build automatically discovers the article, generates its route and metadata, and includes it in the catalog/search.

## Local development

```bash
npm install
npm run dev
npm run build
npm run start
```

## Production

Pushes to `main` run the GitHub Actions workflow and publish the static `out` directory to GitHub Pages.

Current project URL:

`https://vibhuagwl.github.io/vibhu-tech-blog/`

## Structure

```text
app/                 Next.js routes
components/          reusable UI + Mermaid
content/             MDX articles
lib/                 content discovery
.github/workflows/   deployment
```

## Roadmap

- Expand the learning path with HLD/LLD fundamentals
- Add more FinTech designs
- Add richer Mermaid diagrams and sequence diagrams
- Add privacy-friendly analytics
- Add custom domain when ready
