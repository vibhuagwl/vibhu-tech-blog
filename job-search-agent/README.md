# Vibhu — AI Daily Job Search Agent

Daily Cloud Agent that finds **Senior / Staff / Lead Java backend** roles (FinTech, Kafka, AWS, distributed systems) and writes a curated digest.

## Quick start (activate the daily agent)

1. Open **[cursor.com/automations/new](https://cursor.com/automations/new)**
2. Follow **[SETUP.md](./SETUP.md)** (schedule: **8:00 AM IST** every day)
3. Paste **[AUTOMATION_PROMPT.md](./AUTOMATION_PROMPT.md)** as the automation instructions

## Files

| File | Purpose |
|------|---------|
| [AUTOMATION_PROMPT.md](./AUTOMATION_PROMPT.md) | Full agent prompt (paste into Cursor Automation) |
| [PROFILE.md](./PROFILE.md) | Resume-derived target profile |
| [KEYWORDS.md](./KEYWORDS.md) | Search keywords + Boolean queries |
| [SETUP.md](./SETUP.md) | One-time activation steps |
| [digests/](./digests/) | Daily output (`YYYY-MM-DD.md`) + `SEEN.md` |

## Positioning

> Staff/Senior Backend Engineer \| Java \| Spring Boot \| Kafka \| Distributed Systems \| Microservices \| AWS \| FinTech/Payments

## Output quality

- Top **10–15** jobs only (score ≥70)
- Prefer official apply URLs
- No fabricated jobs / salaries / visa claims
- Deduplicated via `digests/SEEN.md` + Memories

## Contact

Digests are for **vibhuagwl@gmail.com**. Cursor has no native Gmail send — use Slack notifications or the Agents UI / digest files.
