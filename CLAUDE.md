# CLAUDE.md — Valeria WhatsApp Bot · Dra. Yuri Quintero

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen)

> This file transfers the full project context to an AI assistant.  
> Created 09/03/2026. Keep it updated with every significant change.

→ See [README.md](./README.md) for setup and deployment · [SECURITY.md](./SECURITY.md) for data
policy · [PROJECT_FILES.md](./PROJECT_FILES.md) for module reference

---

## 1. PROJECT DESCRIPTION

AI-powered WhatsApp bot for **Dra. Yuri Quintero's** aesthetic dentistry practice in Neiva, Huila, Colombia. The bot is
named **Valeria**.

**Goal:** Capture leads from Meta ads (Click-to-WhatsApp), qualify them, collect their data, and guide them to pay a
deposit to confirm a consultation appointment with the doctor.

**The appointment is confirmed by a human receptionist** — Valeria only captures data and provides payment details.

---

## 2. ABSOLUTE BUSINESS RULES

- ❌ **NEVER give exact treatment prices** — only approximate ranges when patient insists (configured in `config.js TREATMENT_PRICES`)
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

| Component         | Status | Detail                                                              |
|-------------------|--------|---------------------------------------------------------------------|
| GitHub Repo       | ✅      | github.com/leosalazarn/valeria-dental-bot (public)                  |
| Render Deploy     | ✅      | https://valeria-dental-bot.onrender.com                             |
| Anthropic API Key | ✅      | Set in Render env vars                                              |
| Supabase          | ✅      | Patient CRM — credentials in Render env vars                        |
| Meta App          | ✅      | "valeria-bot" (App ID in Render env vars)                           |
| Webhook verified  | ✅      | Connected and active                                                |
| Meta Token        | ⚠️     | Temporary (expires 24h) — permanent token pending                   |
| WhatsApp Number   | ⚠️     | Test: +1 (555) 166-5964 — real clinic number pending                |
| Meta App          | ⚠️     | In Development mode — needs to go Live                              |
| Render plan       | ⚠️     | Free (sleeps after 15 min) — upgrade to $7/month before going live  |

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
```

---

## 6. PROJECT STRUCTURE

See [PROJECT_FILES.md](./PROJECT_FILES.md) for the full file tree and per-module descriptions.

Key layout: `src/` (all modules), `tests/` (7 Vitest suites), `.claude/` (settings + slash commands).

---

## 7. KEY CONSTANTS (config.js)

```js
CLAUDE_MODEL = 'claude-sonnet-4-6'
MAX_TOKENS = 450
CONSULTATION_PRICE = ...              // set in config.js
BOOK_PRICE = ...                      // set in config.js
MIN_RANGE_PRICE = 2_700_000          // lowest treatment range (COP)
MAX_RANGE_PRICE = 24_000_000         // highest treatment range (COP)
CONSULTATION_DURATION_MINUTES = 30   // consultation duration
REENGAGEMENT_DELAY_HOURS = 24        // 24h universal re-engagement timer
SESSION_EXPIRY_HOURS = 24
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

### Universal re-engagement (24h)

After every outgoing message in ANY phase, a 24h timer resets. If the patient goes silent:
- `EXTRACTION` → *"quedé pensando en lo que me contaste..."*
- `HOOK` → *"todavía tenemos cupos disponibles..."*
- `DATA_CAPTURE` → *"tengo todo listo para reservar tu cita..."*

### Internal signals (NOT visible to the patient)

The AI appends to its responses:

- `NAME: [name]` → captured by intent.js to update session
- `GOAL: [aesthetic goal]` → captured by intent.js
- `EXTRACTED: full_name: [...], email: [...], consultation_reason: [...]` → in DATA_CAPTURE phase

The `stripSignals()` function in `flow.js` removes these before sending to the patient.

### Positive responses (trigger DATA_CAPTURE)

```js
['listo', 'sí', 'si', 'me convenciste', 'quiero agendar', 'dale', 'claro',
 'ok', 'okay', 'perfecto', 'bueno', 'me interesa', 'quiero', 'vamos',
 'agendemos', 'agendar', 'de acuerdo', 'está bien', 'acepto', 'me animo',
 'cuándo', 'cuando', 'cómo agendo', 'como agendo']
```

---

## 9. MESSAGE CLASSIFICATION (classifier.js)

Dedicated WhatsApp line — no triggers, no supplier detection. In priority order:

1. Group message → **IGNORE**
2. Phone with status `IN_TREATMENT` → **CURRENT_PATIENT**
3. Active session (phase !== `START`) → **ORGANIC_LEAD** (`source: ORGANIC`)
4. Any new individual contact → **WARM_LEAD** (`source: DIRECT`)

---

## 10. MESSAGE DEBOUNCE (webhook.js)

If the patient sends multiple messages in a row, the bot waits **30 seconds** of silence before responding, processing
all messages together as one.

```js
const DEBOUNCE_MS = 30000;
const messageBuffers = new Map(); // key: phone, value: { messages[], timer }
```

---

## 11. BANKING DETAILS (prompt.js)

Injected from environment variables into the prompt. Format of the message Valeria sends:

```
🦷☀️ Te dejo los datos para que puedas realizar el abono de $[BOOK_PRICE]
y confirmar tu cita de valoración presencial:

Bancolombia — Cta Ahorros
[BANK_HOLDER_NAME]
N° [BANCOLOMBIA_ACCOUNT] · CC [BANK_HOLDER_CC]

Nequi
N° [NEQUI_NUMBER]

Davivienda — Cta Ahorros
[BANK_HOLDER_NAME]
N° [DAVIVIENDA_ACCOUNT] · CC [BANK_HOLDER_CC]

Cuando hagas el abono, envíame el comprobante aquí y confirmamos tu cita 🙌
```

---

## 12. CRM — PATIENT OBJECT (crm.js)

```js
{
  phone,                    // from WhatsApp — never ask for it
  name,                     // short name (from conversation)
  full_name,                // full name (from DATA_CAPTURE)
  email,                    // email (from DATA_CAPTURE)
  consultation_reason,      // reason (from DATA_CAPTURE or aesthetic_goal)
  status,                   // NEW | PROSPECT | CONSULTATION_SCHEDULED | IN_TREATMENT | INACTIVE
  aesthetic_goal,           // whitening, smile design, veneers, implants, etc.
  source,                   // DIRECT | ORGANIC
  data_complete,            // boolean — true when full_name + email + consultation_reason are set
  first_contact,
  last_interaction,
  notes
}
// Persisted in Supabase — survives server restarts
// TODO: integrate with DentalLink API when data_complete === true
```

---

## 13. ANTHROPIC API RETRIES (ai.js)

```js
MAX_RETRIES = 3
RETRY_DELAY_MS = 2000       // exponential backoff: 2s, 4s
// Retries on: 529 (overloaded), 503, 500
// Fails immediately on: 401, 400, etc.
```

---

## 14. ENDPOINTS

| Method | Route    | Purpose                         |
|--------|----------|---------------------------------|
| GET    | /        | Health check                    |
| GET    | /webhook | Meta verification               |
| POST   | /webhook | Receive WhatsApp messages       |
| GET    | /leads   | All in-memory patients (debug)  |
| GET    | /stats   | Summary by source/status/intent |

---

## 15. PENDING (priority order)

1. **Permanent Meta token** → Meta Business Suite → Settings → System Users → generate token with `whatsapp_business_messaging`
2. **Real clinic phone number** → register in Meta (remove personal WhatsApp from number first)
3. **Meta App to Live mode** → requires registered real number
4. **Upgrade Render to $7/month** → eliminates 15-min sleep — **critical before going live**
5. **Meta Business Verification** → RUT or chamber of commerce from Dra. Yuri (for 1k+ conversations/month)
6. **DentalLink integration** → API for automatic scheduling (TODO in crm.js)

---

## 16. TECHNICAL DECISIONS

| Decision                       | Reason                                                                       |
|--------------------------------|------------------------------------------------------------------------------|
| No n8n                         | The state machine with phases and timers required custom logic               |
| No Google Sheets               | Crashed the server on startup — replaced by in-memory Map                    |
| Supabase for CRM               | Free tier, persistent across restarts, minimal code change (2 functions)     |
| Public repo                    | Safe — .env excluded by .gitignore, sensitive data in Render                 |
| Dedicated WhatsApp line        | Eliminates need for triggers/supplier detection — every contact is a lead    |
| Respond to all individual msgs | No IGNORE for unknown contacts — dedicated line = intent assumed             |
| Price ranges (not exact)       | Reduces drop-off when patients ask budget — still drives toward valoración   |
| MIN_EXCHANGES_FOR_HOOK = 3     | Prevents premature pitch — needs rapport before offering consultation        |
| Universal 24h reengagement     | Covers all phases — patient silences detected regardless of funnel position  |
| All data in 1 message          | Asks for full name + email + reason in a single message (token optimization) |
| Sonnet 4.6 model               | Haiku gave frequent 529 errors — Sonnet is more stable                       |

---

## 17. CODE CONVENTIONS

- ES Modules (`import/export`) — no CommonJS
- Async/await for all I/O operations
- Emoji-prefixed logs via `logger.js`: `📩 incoming`, `📤 outgoing`, `🎯 trigger`, `❌ error`
- Error handling with try/catch in all async functions
- Business constants ALWAYS in `config.js`, never hardcoded elsewhere

## 18. ENGINEERING WORKFLOW

### Before writing any code

1. Read CLAUDE.md fully
2. Identify which modules are affected
3. State the plan explicitly before touching any file
4. Check if existing tests cover the area — if not, write them first

### Code standards

- Never hardcode user-facing text — use config.js MSG_* constants
- Never add sensitive data to any file — env vars only
- All async functions must have try/catch
- Business constants always in config.js

### Before declaring done

- Run npm test — all tests must pass
- Verify no new hardcoded strings were introduced
- Confirm no sensitive data was added to any file
- State which files were modified and why

### Debugging protocol

- Read the full error before proposing a fix
- Identify root cause, not just symptoms
- Never apply a workaround without flagging it

---

## 19. PRACTICE INFORMATION

- **Name:** Dra. Yuri Quintero — Aesthetic Dentistry
- **Location:** Neiva, Huila, Colombia
- **Office hours:** Monday–Friday 8am-12pm (AM part) 2pm–6pm (PM part), Saturdays 8am–12pm
- **Specialties:** Smile design, 3D resins, composite resins, high-durability ceramic veneers, whitening, fillings &
  restorations, general dentistry