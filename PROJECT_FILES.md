# 📦 Project Files Overview

**Project:** Valeria — AI Assistant for Dra. Yuri Quintero's clinic  
**Repository:** github.com/leosalazarn/valeria-dental-bot  
**Last updated:** March 2026

---

## File Structure

```
valeria-dental-bot/
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── CLAUDE.md
├── README.md
├── SECURITY.md
├── PROJECT_FILES.md
├── tests/
│   ├── crm.test.js
│   ├── session.test.js
│   ├── classifier.test.js
│   ├── intent.test.js
│   ├── flow.test.js
│   ├── prompt.test.js
│   └── utils/
│       └── time.test.js
└── src/
    ├── config.js
    ├── crm.js
    ├── session.js
    ├── classifier.js
    ├── prompt.js
    ├── ai.js
    ├── whatsapp.js
    ├── intent.js
    ├── flow.js
    ├── routes/
    │   ├── webhook.js
    │   └── debug.js
    └── utils/
        ├── logger.js
        └── time.js
```

---

## Source Modules

| File                | Purpose                                                             |
|---------------------|---------------------------------------------------------------------|
| `server.js`         | Express entry point — mounts routes, starts server                  |
| `config.js`         | Env vars, business constants, and all user-facing message templates |
| `crm.js`            | In-memory patient store — `findPatient()` / `upsertPatient()`       |
| `session.js`        | Session Map — history, phase, timers, 24h auto-cleanup              |
| `classifier.js`     | 4-rule message classifier (group → treatment → session → new)       |
| `prompt.js`         | Builds dynamic system prompt per session phase                      |
| `ai.js`             | Calls Claude API with 3-retry exponential backoff                   |
| `whatsapp.js`       | Sends messages via Meta WhatsApp Cloud API                          |
| `intent.js`         | Parses NAME/GOAL/EXTRACTED signals from AI responses                |
| `flow.js`           | Orchestrates full message pipeline (classify → AI → send)           |
| `routes/webhook.js` | GET (Meta verification) + POST (inbound messages) + debounce        |
| `routes/debug.js`   | `/leads` and `/stats` debug endpoints                               |
| `utils/logger.js`   | Emoji-prefixed console logging — no sensitive data                  |
| `utils/time.js`     | Colombia timezone helper (America/Bogota)                           |

---

---

## Documentation

| File               | Purpose                                                   |
|--------------------|-----------------------------------------------------------|
| `README.md`        | Setup, architecture, deployment, endpoints                |
| `CLAUDE.md`        | Full project context for AI assistant handoff             |
| `SECURITY.md`      | Credential policy, privacy rules, vulnerability reporting |
| `PROJECT_FILES.md` | This file — module reference and test inventory           |

---

## Environment Variables

All credentials and sensitive business data are stored exclusively as environment variables in Render. See `.env.example` for the full list of required keys.

> ⚠️ Never commit real values. Banking details, API keys, and patient data must never appear in source code or documentation. See `SECURITY.md` for the full policy.

---

## Dependencies

```
Production:
  express              ^4.18.2
  @anthropic-ai/sdk    ^0.39.0
  dotenv               ^16.4.5

Development:
  vitest               ^4.0.0
```
