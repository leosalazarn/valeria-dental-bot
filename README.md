# 🦷 Valeria — AI WhatsApp Assistant · Dra. Yuri Quintero

Valeria is a production-grade WhatsApp Business AI assistant for an aesthetic dentistry practice in Neiva, Colombia. It
handles inbound inquiries on a dedicated WhatsApp line 24/7, qualifies patients, and guides them through scheduling a
consultation with the doctor.

> **Dedicated line architecture** — every person who messages is treated as a potential patient. No trigger filtering,
> no supplier detection.

---

## Features

- **24/7 availability** — responds instantly regardless of office hours
- **Natural conversation** — warm Colombian Spanish, never robotic
- **Multiphase conversion flow** — guides patient from first contact to consultation deposit
- **Silent data extraction** — captures name and aesthetic goal without interrupting conversation
- **Re-engagement timer** — follows up automatically after 30 minutes of silence
- **Intent tracking** — logs objection type, phase, and outcome per patient
- **In-memory CRM** — session + patient data with 24h auto-cleanup

---

## Tech Stack

| Component | Solution                               |
|-----------|----------------------------------------|
| Runtime   | Node.js 18+ / Express                  |
| AI        | Anthropic Claude (`claude-sonnet-4-6`) |
| Messaging | Meta WhatsApp Cloud API                |
| Hosting   | Render.com                             |
| Storage   | In-memory Map (CRM migration ready)    |
| Tests     | Vitest (95 tests, 100% passing)        |

---

## Project Structure

```
valeria-dental-bot/
├── server.js                  ← Express entry point
├── package.json
├── .env.example               ← Environment variable template (no secrets)
├── CLAUDE.md                  ← Full context for AI assistants
├── README.md                  ← This file
├── SECURITY.md                ← Security policy
└── src/
    ├── config.js              ← Env vars + business constants + message templates
    ├── crm.js                 ← In-memory patient store (CRM-ready interface)
    ├── session.js             ← Session Map + 24h auto-cleanup
    ├── classifier.js          ← 4-rule message classifier
    ├── prompt.js              ← Dynamic system prompt builder
    ├── ai.js                  ← Claude API wrapper with retry logic
    ├── whatsapp.js            ← Meta API sendMessage()
    ├── intent.js              ← Intent extraction + NAME/GOAL signal parsing
    ├── flow.js                ← Conversation orchestration
    ├── routes/
    │   ├── webhook.js         ← GET/POST /webhook + message debounce
    │   └── debug.js           ← GET /leads, /stats
    └── utils/
        ├── logger.js          ← Emoji-prefixed console logging
        └── time.js            ← Colombia timezone (America/Bogota)
```

---

## Conversation Flow

```
EXTRACTION → HOOK → DATA_CAPTURE → PAYMENT → CLOSING
```

| Phase        | Trigger                         | Action                               |
|--------------|---------------------------------|--------------------------------------|
| EXTRACTION   | Session start — no name or goal | AI extracts name + aesthetic goal    |
| HOOK         | Name + goal both available      | Hardcoded pitch for the consultation |
| DATA_CAPTURE | Positive response to hook       | Collects full name, email, reason    |
| PAYMENT      | Data complete                   | AI sends banking details for deposit |
| CLOSING      | Payment instructions sent       | Awaits receipt, confirms appointment |

---

## Message Classification

Four rules evaluated in order:

1. **Group message** → IGNORE
2. **`IN_TREATMENT` patient** → CURRENT_PATIENT (post-treatment flow)
3. **Active session** (phase ≠ `START`) → ORGANIC_LEAD
4. **Any new contact** → WARM_LEAD (`source: DIRECT`)

---

## Setup

### Prerequisites

- Node.js ≥ 18
- Meta WhatsApp Business account with Cloud API access
- Anthropic API key

### Local Development

```bash
git clone https://github.com/leosalazarn/valeria-dental-bot.git
cd valeria-dental-bot
npm install
cp .env.example .env   # fill in your credentials
npm run dev
```

### Environment Variables

```env
ANTHROPIC_API_KEY=...          # Anthropic Console
WA_ACCESS_TOKEN=...            # Meta token (permanent via System Users)
WA_PHONE_NUMBER_ID=...         # Meta phone number ID
VERIFY_TOKEN=...               # Webhook verification token
BANK_HOLDER_NAME=...           # Account holder name
BANK_HOLDER_CC=...             # Account holder national ID
BANCOLOMBIA_ACCOUNT=...        # Bancolombia savings account
NEQUI_NUMBER=...               # Nequi phone number
DAVIVIENDA_ACCOUNT=...         # Davivienda savings account
```

See `.env.example` for full template.

---

## Deployment (Render.com)

1. Push to GitHub (`.env` must be in `.gitignore`)
2. Create a new **Web Service** on Render.com
3. Connect the repository
4. Set build command: `npm install` · Start command: `npm start`
5. Add all environment variables in the Render dashboard
6. Set Meta webhook URL: `https://your-app.onrender.com/webhook`

> ⚠️ Upgrade to the **$7/month** paid plan before going live — the free plan sleeps after 15 minutes of inactivity.

---

## API Endpoints

| Method | Endpoint   | Purpose                           |
|--------|------------|-----------------------------------|
| GET    | `/`        | Health check                      |
| GET    | `/webhook` | Meta webhook verification         |
| POST   | `/webhook` | Receive inbound WhatsApp messages |
| GET    | `/leads`   | All patients in memory (debug)    |
| GET    | `/stats`   | Summary by source/status/phase    |

---
## Commands

```bash
npm install     # Install dependencies
npm start       # Production mode
npm run dev     # Development mode with auto-reload
```

## Testing

```bash
npm test           # Run full test suite (Vitest)
npm run test:watch # Watch mode during development
```


---

## Security

See [SECURITY.md](./SECURITY.md) for the full security policy, vulnerability reporting process, and data handling
guidelines.

---

## License

Proprietary — All rights reserved. Developed for Dra. Yuri Quintero — Perfeccionamiento dental #OdontologíaHechaConAmor,
Neiva, Colombia.