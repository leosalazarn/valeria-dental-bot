# CLAUDE.md — Valeria WhatsApp Bot · Dra. Yuri Quintero

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![Status](https://img.shields.io/badge/status-phase--3--conversion-brightgreen)

> This file transfers the full project context to an AI assistant.  
> Created 09/03/2026. Keep it updated with every significant change.

→ See [README.md](./README.md) for setup and deployment · [ROADMAP.md](./docs/ROADMAP.md) for status · [SECURITY.md](./docs/SECURITY.md) for data
policy · [PROJECT_FILES.md](./docs/PROJECT_FILES.md) for module reference

---

## 1. PROJECT DESCRIPTION

AI-powered WhatsApp bot for **Dra. Yuri Quintero's** aesthetic dentistry practice in Neiva, Huila, Colombia. The bot is
named **Valeria**.

**Goal:** Capture leads from Meta ads (Click-to-WhatsApp), qualify them, collect their data, and guide them to pay a
deposit to confirm a consultation appointment with the doctor.

**The appointment is confirmed by a human receptionist** — Valeria only captures data and provides payment details.

---

## 2. ABSOLUTE BUSINESS RULES

- ❌ **NEVER give exact treatment prices** — only approximate ranges when patient insists (configured in
  `config.js TREATMENT_PRICES`)
- ❌ **NEVER ask for ID or additional phone number** — phone is already known from WhatsApp
- ❌ **NEVER confirm or schedule appointments** — only capture data (DentalLink integration pending)
- ✅ Dra. Yuri is a woman: always "la Dra. Yuri" or "la doctora"
- ✅ Valeria always uses informal "tú" — natural, warm Colombian Spanish
- ✅ Maximum 3 lines per message
- ✅ Maximum 1 emoji per message
- ✅ Deposit required to confirm the slot — amounts set in env vars (BOOK_PRICE, CONSULTATION_PRICE)

---

## 3. TECH STACK

| Component | Solution                                           |
|-----------|----------------------------------------------------|
| WhatsApp  | Meta Cloud API (free up to 1k conversations/month) |
| AI        | Anthropic Claude (model: `claude-sonnet-4-6`)      |
| Server    | Node.js + Express                                  |
| Hosting   | Render.com                                         |
| Database  | Supabase (PostgreSQL) — patient CRM                |

---

## 4. INFRASTRUCTURE

| Component         | Status | Detail                                                             |
|-------------------|--------|--------------------------------------------------------------------|
| GitHub Repo       | ✅      | github.com/leosalazarn/valeria-dental-bot (public)                 |
| Render Deploy     | ✅      | https://valeria-dental-bot.onrender.com                            |
| Anthropic API Key | ✅      | Set in Render env vars                                             |
| Supabase          | ✅      | Patient CRM — credentials in Render env vars                       |
| Meta App          | ✅      | "valeria-bot" (App ID in Render env vars)                          |
| Webhook verified  | ✅      | Connected and active                                               |
| Meta Token        | ⚠️     | Temporary (expires 24h) — permanent token pending                  |
| WhatsApp Number   | ⚠️     | Test: +1 (555) 166-5964 — real clinic number pending               |
| Meta App          | ⚠️     | In Development mode — needs to go Live                             |
| Render plan       | ⚠️     | Free (sleeps after 15 min) — upgrade to $7/month before going live |

---

## 5. ENVIRONMENT VARIABLES (Render)

```env
ANTHROPIC_API_KEY=sk-ant-...          # Anthropic API key
WA_ACCESS_TOKEN=...                    # Meta token (expires 24h)
WA_PHONE_NUMBER_ID=...                 # Meta phone number ID
VERIFY_TOKEN=...                       # Webhook verification token
BANK_HOLDER_NAME=...                   # Account holder full name
BANK_HOLDER_CC=...                     # Account holder ID number
BANCOLOMBIA_ACCOUNT=...                # Bancolombia account number
NEQUI_NUMBER=...                       # Nequi phone number
DAVIVIENDA_ACCOUNT=...                 # Davivienda savings account number
SUPABASE_URL=...                       # Supabase → Project Settings → API → Project URL
SUPABASE_ANON_KEY=...                  # Supabase → Project Settings → API → anon public key
DEBUG_API_KEY=...                      # Custom key for metrics protection
```

---

## 6. PROJECT STRUCTURE

See [PROJECT_FILES.md](./docs/PROJECT_FILES.md) for the full file tree and per-module descriptions.

Key layout: `src/` (all modules), `tests/` (7 Vitest suites), `docs/` (roadmap, security, files), `.claude/` (settings + slash commands).

---

## 7. KEY CONSTANTS (config.js)

```js
CLAUDE_MODEL = 'claude-sonnet-4-6'
MAX_TOKENS = 1000
CONSULTATION_PRICE = ...              // set in config.js
BOOK_PRICE = ...                      // set in config.js
MIN_RANGE_PRICE = 2_700_000          // lowest treatment range (COP)
MAX_RANGE_PRICE = 24_000_000         // highest treatment range (COP)
CONSULTATION_DURATION_MINUTES = 30   // consultation duration
REENGAGEMENT_DELAY_HOURS = 24        // send re-engagement after 24h of silence
SESSION_EXPIRY_HOURS = 72            // expire sessions after 72h of total inactivity
```

---

## 8. CONVERSATION FLOW (flow.js)

```
EXTRACTION → HOOK → DATA_CAPTURE → PAYMENT → CLOSING
```

| Phase        | Entry condition                                      | Action                              |
|--------------|------------------------------------------------------|-------------------------------------|
| EXTRACTION   | No name or no aesthetic_goal                         | AI extracts name and goal naturally |
| HOOK         | Has name + goal AND ≥3 exchanges (MIN_EXCHANGES = 3) | Hardcoded consultation pitch        |
| DATA_CAPTURE | Patient responds positively to hook                  | Asks for full name, email, reason   |
| PAYMENT      | data_complete = true                                 | AI sends exact banking details      |
| CLOSING      | payment_info_sent = true + next message              | AI awaits receipt, confirms         |

---

## 9. MESSAGE CLASSIFICATION (classifier.js)

1. Group message → **IGNORE**
2. Phone status `IN_TREATMENT` → **CURRENT_PATIENT**
3. Active session (phase !== `START`) → **ORGANIC_LEAD**
4. Any new individual contact → **WARM_LEAD**

---

## 10. ENDPOINTS

See [ENDPOINTS.md](./docs/reference/ENDPOINTS.md) for all routes and auth requirements.

---

## 11. TECHNICAL DECISIONS

- **Supabase for CRM:** Persistent storage for leads and sessions.
- **Dedicated WhatsApp line:** Simplifies lead routing.
- **Price ranges:** Reduces drop-off by providing estimates without exact quotes.
- **Universal reengagement:** Automated follow-ups after 24h of silence.

---

## 12. ENGINEERING WORKFLOW

1. **Research:** Map modules and identify dependencies.
2. **Strategy:** State the plan before making changes.
3. **Act:** Small, focused edits to files.
4. **Validate:** Run `npm test` and verify no security regressions.
