# API Endpoints — Valeria WhatsApp Bot

| Method | Route                         | Purpose                              | Auth                                   |
|--------|-------------------------------|--------------------------------------|----------------------------------------|
| GET    | /debug/                       | Health check                         | Public                                 |
| GET    | /webhook                      | Meta verification                    | Public                                 |
| POST   | /webhook                      | Receive WhatsApp messages            | Public                                 |
| GET    | /debug/leads                  | All persistent patients (Supabase)   | x-api-key or session                   |
| GET    | /debug/stats                  | Summary by source/status/intent      | x-api-key or session                   |
| GET    | /debug/metrics                | Funnel & response time analytics     | x-api-key or session                   |
| GET    | /dashboard-valeria-statistics | Lead Dashboard UI (HTML)             | Rate-limited (30/15 min)               |
| POST   | /dashboard/login              | Validate API key, create server session | Public (validates key internally)   |
| GET    | /dashboard/check-session      | Check if session is active           | Session cookie                         |

## Notes

- Debug endpoints (`/debug/leads`, `/debug/stats`, `/debug/metrics`) accept **either** `x-api-key` header **or** an
  active `express-session` cookie (established via `POST /dashboard/login`).
- The dashboard route (`/dashboard-valeria-statistics`) is rate-limited to 30 requests per 15 minutes per IP.
- All session cookies are HttpOnly, sameSite lax, and expire after 24 hours.
