# Security Policy — Valeria WhatsApp Bot

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![Security](https://img.shields.io/badge/security-hardened-brightgreen)

→ See [README.md](../README.md) for setup · [PROJECT_FILES.md](./PROJECT_FILES.md) for module reference

---

## Supported Versions

Only the latest version deployed on Render.com is actively maintained and receives security updates.

| Version              | Supported |
|----------------------|-----------|
| latest (main branch) | ✅         |
| older commits        | ❌         |

---

## Sensitive Data Policy

### Data Classification

| Data                     | Classification     | Storage               |
|--------------------------|--------------------|-----------------------|
| Anthropic API key        | Critical           | Render env vars only  |
| Meta access token        | Critical           | Render env vars only  |
| Webhook verify token     | Critical           | Render env vars only  |
| Debug API key            | Critical           | Render env vars only  |
| Banking account numbers  | Critical           | Render env vars only  |
| Account holder name / ID | Sensitive          | Render env vars only  |
| Patient data             | Personal / Medical | Supabase (PostgreSQL) |

### Rules

- **No sensitive data in source code** — ever. All secrets via environment variables exclusively.
- **No sensitive data in documentation** — `CLAUDE.md`, `README.md`, and all markdown files committed to the repository must contain only placeholder values.
- **No sensitive data in logs** — `logger.js` logs only truncated message text and masked phone numbers.
- **Banking details** are injected into the AI prompt at runtime from env vars and are never persisted to disk or version control.
- **Patient data persistence** is handled by Supabase with Row Level Security (RLS) or internal API access.

---

## Credential Management

### Storage

All credentials are stored exclusively as **Render environment variables** (encrypted at rest, not visible in build logs).  
The `.env` file is listed in `.gitignore` and must never be committed.  
`.env.example` contains only placeholder keys (`...`) — no real values.

### Authentication

Access to debug endpoints (`/debug/leads`, `/debug/stats`, `/debug/metrics`) requires an `x-api-key` header matching the `DEBUG_API_KEY` defined in the environment.

### Token Types

The Meta access token should be a **permanent token** generated via:  
`Meta Business Suite → Settings → System Users → Generate token → whatsapp_business_messaging`

---

## Input Validation & Injection Prevention

| Control                        | Implementation                                                                                                                                                   |
|--------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Security Guardrails            | System prompt includes explicit instructions in Spanish to reject jailbreaks and off-topic requests.                                                             |
| Webhook challenge sanitization | `hub.challenge` validated against `/^\d+$/` before reflection — prevents XSS on verification endpoint                                                            |
| Non-text message rejection     | Only `type === 'text'` messages reach the AI pipeline.                                                                                                           |
| Anti-Flood Mechanism           | Debounce of 5s, hard cap of 5 messages before immediate processing, and an absolute max of 10 messages per burst to prevent token exhaustion and prompt clutter. |
| Signal stripping               | `NAME:`, `GOAL:`, `EXTRACTED:` signals removed from AI responses via `stripSignals()` before delivery to patient                                                 |

---

## Patient Privacy

- Valeria operates on a **dedicated WhatsApp line**.
- Patient data is persisted in **Supabase**, allowing for seamless conversation recovery after server restarts.
- The bot **never asks for national ID (cédula)** or additional phone numbers.
- Conversation history uses a **sliding window of 20 messages** to manage context efficiency.

---

## Vulnerability Reporting

If you discover a security vulnerability, please contact the repository owner directly via private message. Do not open public issues for security flaws.
