# Tech Stack — Valeria WhatsApp Bot

| Component | Solution                                           |
|-----------|----------------------------------------------------|
| WhatsApp  | Meta Cloud API (free up to 1k conversations/month) |
| AI        | Anthropic Claude (model: `claude-sonnet-4-6`)      |
| Server    | Node.js + Express (ES Modules)                     |
| Hosting   | Render.com                                         |
| Database  | Supabase (PostgreSQL) — patient CRM                |
| Tests     | Vitest — 94 tests, 7 suites                        |

## Key Constants

| Constant                | Value               |
|-------------------------|---------------------|
| `CLAUDE_MODEL`          | `claude-sonnet-4-6` |
| `MAX_TOKENS`            | 1000                |
| `CONSULTATION_DURATION` | 30 min              |
| `REENGAGEMENT_DELAY`    | 24 hours            |
| `SESSION_EXPIRY`        | 72 hours            |
| `MAX_HISTORY`           | 20 messages         |
| `DEBOUNCE_MS`           | 5000ms              |
| `BUFFER_HARD_CAP`       | 5 messages          |
| `MAX_BUFFER_SIZE`       | 10 messages         |
