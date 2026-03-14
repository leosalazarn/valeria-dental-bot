# 📦 Project Files Overview

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![Modules](https://img.shields.io/badge/modules-14-lightgrey)
![Tests](https://img.shields.io/badge/tests-95%20passed-brightgreen)

**Project:** Valeria — AI Assistant · Dra. Yuri Quintero's clinic 
**Repository:** [github.com/leosalazarn/valeria-dental-bot](https://github.com/leosalazarn/valeria-dental-bot)  
**Last updated:** March 2026

→ See [README.md](./README.md) for setup and deployment · [SECURITY.md](./SECURITY.md) for data policy · [CLAUDE.md](./CLAUDE.md) for full project context

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

| File                | Responsibility                                                         |
|---------------------|------------------------------------------------------------------------|
| `server.js`         | Express entry point — mounts routes, starts server                     |
| `config.js`         | Env vars, business constants, all user-facing message templates        |
| `crm.js`            | In-memory patient store — `findPatient()` / `upsertPatient()`          |
| `session.js`        | Session Map — history, phase, timers, 24h auto-cleanup                 |
| `classifier.js`     | 4-rule classifier: group → IN_TREATMENT → active session → new contact |
| `prompt.js`         | Builds dynamic system prompt per session phase                         |
| `ai.js`             | Claude API wrapper — 3-retry exponential backoff (2s, 4s)              |
| `whatsapp.js`       | Sends messages via Meta WhatsApp Cloud API                             |
| `intent.js`         | Parses `NAME:` / `GOAL:` / `EXTRACTED:` signals from AI responses      |
| `flow.js`           | Full pipeline: classify → conversion flow → AI → strip signals → send  |
| `routes/webhook.js` | GET Meta verification + POST inbound messages + 10s debounce           |
| `routes/debug.js`   | `/leads` and `/stats` — debug only, unauthenticated                    |
| `utils/logger.js`   | Emoji-prefixed console logging — no sensitive data in output           |
| `utils/time.js`     | Colombia timezone helper (`America/Bogota`)                            |

---

## Test Suite

![Tests](https://img.shields.io/badge/tests-95%20passed-brightgreen)
![Coverage](https://img.shields.io/badge/suites-7-blue)
![Framework](https://img.shields.io/badge/framework-Vitest-yellow)

```bash
npm test            # run once
npm run test:watch  # watch mode
```

| Suite                | Tests  | What it covers                                                              |
|----------------------|--------|-----------------------------------------------------------------------------|
| `crm.test.js`        | 14     | Patient CRUD, defaults, merging, `data_complete` auto-promotion             |
| `session.test.js`    | 13     | Lifecycle, `updateSession`, history sliding window, timers                  |
| `classifier.test.js` | 9      | All 4 classification rules                                                  |
| `intent.test.js`     | 15     | NAME/GOAL extraction, all intent types, EXTRACTED parsing, CRM side effects |
| `flow.test.js`       | 16     | `stripSignals`, `POSITIVE_RESPONSES`, full pipeline with mocked AI/WhatsApp |
| `prompt.test.js`     | 21     | Prompt content, phase-specific sections, session context injection          |
| `utils/time.test.js` | 7      | ISO output, Colombia timezone offset, edge cases                            |
| **Total**            | **95** |                                                                             |

---

## Documentation

| File                                   | Purpose                                                   |
|----------------------------------------|-----------------------------------------------------------|
| [README.md](./README.md)               | Setup, architecture, deployment, endpoints                |
| [CLAUDE.md](./CLAUDE.md)               | Full project context for AI assistant handoff             |
| [SECURITY.md](./SECURITY.md)           | Credential policy, privacy rules, vulnerability reporting |
| [PROJECT_FILES.md](./PROJECT_FILES.md) | This file — module reference and test inventory           |

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

---

## Security Note

All credentials and sensitive business data are stored exclusively as Render environment variables.  
`.env.example` contains only placeholder values — no real keys.

> ⚠️ Banking details, API keys, and patient data must never appear in source code or documentation. See [SECURITY.md](./SECURITY.md) for the full policy.