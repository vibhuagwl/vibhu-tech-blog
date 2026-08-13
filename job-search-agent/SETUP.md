# Setup — Daily Job Search Agent (Cursor Automation)

This package configures a **daily AI agent** that searches Senior/Staff Java backend jobs for Vibhu and writes a digest under `job-search-agent/digests/`.

Cursor Automations are created in the **Cursor UI** (there is no public API to create them from this repo). Follow the steps below once; then the agent runs every morning automatically.

---

## 1. Create the automation (5 minutes)

1. Open **[cursor.com/automations/new](https://cursor.com/automations/new)**  
   (or Agents Window → create automation, or type `/automate` in chat).
2. **Name:** `Vibhu Daily Job Search`
3. **Trigger:** Scheduled  
   - Cron (8:00 AM IST):  
     `CRON_TZ=Asia/Kolkata 0 8 * * *`  
   - If timezone prefix is rejected, use UTC: `30 2 * * *` (02:30 UTC = 08:00 IST).
4. **Repository:**  
   - Attach **`vibhuagwl/vibhu-tech-blog`** (this repo) so digests can be committed under `job-search-agent/digests/`.  
   - Or choose **No repository** if you only want Slack / agent UI output (no file writes).
5. **Tools:** enable  
   - Memories (avoid repeating jobs)  
   - Computer use / browser (career pages)  
   - Send to Slack (optional — recommended)  
   - Disable PR auto-merge; allow opening PRs only if you want digests as PRs
6. **Prompt:** paste the full contents of [`AUTOMATION_PROMPT.md`](./AUTOMATION_PROMPT.md).  
   Add at the top:  
   `Read job-search-agent/PROFILE.md and job-search-agent/KEYWORDS.md and job-search-agent/digests/SEEN.md before searching.`
7. **Save & activate.**
8. Click **Run now** once to verify. Check the run at [cursor.com/agents](https://cursor.com/agents).

---

## 2. Delivery options

| Channel | How |
|---------|-----|
| Cursor Agents UI | Always available after each run |
| Repo digest file | Agent writes `job-search-agent/digests/YYYY-MM-DD.md` |
| Slack | Enable “Send to Slack” in the automation |
| Gmail (`vibhuagwl@gmail.com`) | **No native Gmail tool.** Options: Slack → email notifications, or Zapier/Make watching Slack/GitHub, or an email MCP |

---

## 3. What “success” looks like each morning

- New file: `job-search-agent/digests/2026-08-14.md` (example)
- Updated: `job-search-agent/digests/SEEN.md`
- 10–15 ranked jobs ≥70% match (or an explicit “thin day” note)
- Zero fabricated URLs

---

## 4. Manual fallback

If the automation is paused, message any Cloud Agent:

```text
Daily job search — last 24h — India — Staff/Senior Java Spring Kafka FinTech —
use job-search-agent/PROFILE.md + KEYWORDS.md — write digest to job-search-agent/digests/
```

---

## 5. Optional: GitHub Actions reminder

See [`.github/workflows/daily-job-search-reminder.yml`](../.github/workflows/daily-job-search-reminder.yml).  
This does **not** replace Cursor Automations; it only opens an issue reminder if you want a backup nudge. For a true AI run, keep the Cursor Automation as the primary scheduler.

---

## 6. Cost note

Each run uses **Cloud Agent** billing. Daily morning digests are typically one short agent run per day.
