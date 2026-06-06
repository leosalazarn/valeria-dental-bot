# Tech Stack — Valeria WhatsApp Bot

| Component  | Solution                                                                                                       |
|------------|----------------------------------------------------------------------------------------------------------------|
| WhatsApp   | Meta Cloud API (free up to 1k conversations/month)                                                             |
| AI         | Anthropic Claude (models: `claude-haiku-4-5-20251001` default, `claude-3-7-sonnet-latest` for complex queries) |
| Server     | Node.js + Express (ES Modules) + express-session + express-rate-limit + lusca (CSRF)                           |
| Hosting    | Render.com                                                                                                     |
| Database   | Supabase (PostgreSQL) — lead data & metrics                                                                    |
| Scheduling | Gestión Odontológica — clinic staff manages appointments manually in their existing practice management system |
| Tests      | Vitest — 108 tests, 10 suites                                                                                  |

## LLM Routing (`src/model-router.js`)

| Feature        | Details                                                                 |
|----------------|-------------------------------------------------------------------------|
| Classification | LLM-as-a-judge via Haiku — classifies messages as `SIMPLE` or `COMPLEX` |
| Fallback       | Silently defaults to `SIMPLE` on invalid JSON or API error              |
| Test coverage  | 6 tests (classifyMessage + routeMessage + fallback + error paths)       |

## Key Constants

| Constant                | Value                       |
|-------------------------|-----------------------------|
| `CLAUDE_MODEL`          | `claude-haiku-4-5-20251001` |
| `COMPLEX_MODEL`         | `claude-3-7-sonnet-latest`  |
| `MAX_TOKENS`            | 500                         |
| `CLASSIFIER_MAX_TOKENS` | 50                          |
| `CONSULTATION_DURATION` | 30 min                      |
| `REENGAGEMENT_DELAY`    | 24 hours                    |
| `SESSION_EXPIRY`        | 72 hours                    |
| `MAX_HISTORY`           | 10 messages                 |
| `DEBOUNCE_MS`           | 5000ms                      |
| `BUFFER_HARD_CAP`       | 5 messages                  |
| `MAX_BUFFER_SIZE`       | 10 messages                 |
