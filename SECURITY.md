# Security Policy — Valeria WhatsApp Bot

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![Security](https://img.shields.io/badge/security-reviewed-brightgreen)

→ See [README.md](./README.md) for setup · [PROJECT_FILES.md](./PROJECT_FILES.md) for module reference

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

| Data                     | Classification     | Storage              |
|--------------------------|--------------------|----------------------|
| Anthropic API key        | Critical           | Render env vars only |
| Meta access token        | Critical           | Render env vars only |
| Webhook verify token     | Critical           | Render env vars only |
| Banking account numbers  | Critical           | Render env vars only |
| Account holder name / ID | Sensitive          | Render env vars only |
| Patient names            | Personal           | In-memory, 24h TTL   |
| Patient emails           | Personal           | In-memory, 24h TTL   |
| WhatsApp phone numbers   | Personal           | In-memory, 24h TTL   |
| Consultation reasons     | Personal / Medical | In-memory, 24h TTL   |

### Rules

- **No sensitive data in source code** — ever. All secrets via environment variables exclusively.
- **No sensitive data in documentation** — `CLAUDE.md`, `README.md`, and all markdown files committed to the repository must contain only placeholder values.
- **No sensitive data in logs** — `logger.js` logs only truncated message text and partial phone numbers.
- **Banking details** are injected into the AI prompt at runtime from env vars and are never persisted to disk or version control.
- **Patient data** lives only in the in-memory CRM Map and is automatically purged after 24 hours of inactivity.

---

## Credential Management

### Storage

All credentials are stored exclusively as **Render environment variables** (encrypted at rest, not visible in build logs).  
The `.env` file is listed in `.gitignore` and must never be committed.  
`.env.example` contains only placeholder keys (`...`) — no real values.

### Token Types

The Meta access token should be a **permanent token** generated via:  
`Meta Business Suite → Settings → System Users → Generate token → whatsapp_business_messaging`

Temporary 24h tokens must only be used during development and rotated daily.

### Rotation Policy

| Credential        | Rotate when                                   |
|-------------------|-----------------------------------------------|
| Anthropic API key | Suspected exposure or team member offboarding |
| Meta access token | Suspected exposure or Meta policy change      |
| Verify token      | Suspected exposure                            |
| Banking data      | Account change by clinic                      |

---

## Input Validation & Injection Prevention

| Control                        | Implementation                                                                                                   |
|--------------------------------|------------------------------------------------------------------------------------------------------------------|
| Webhook challenge sanitization | `hub.challenge` validated against `/^\d+$/` before reflection — prevents XSS on verification endpoint            |
| Non-text message rejection     | Only `type === 'text'` messages reach the AI pipeline; audio, images, and documents return a polite notice       |
| Message debounce               | Consecutive messages buffered for 10s and processed as one — limits prompt injection via flooding                |
| Signal stripping               | `NAME:`, `GOAL:`, `EXTRACTED:` signals removed from AI responses via `stripSignals()` before delivery to patient |

---

## Patient Privacy

- Valeria operates on a **dedicated WhatsApp line** — only the clinic's registered number. The bot does not respond on personal or shared numbers.
- Patient conversations are stored **in memory only** — no database persistence by default. All data is lost on server restart.
- The bot **never asks for national ID (cédula)** or additional phone numbers. The WhatsApp number is the only identifier collected.
- Conversation history uses a **sliding window of 20 messages** — older turns are automatically discarded.
- Patient data is never shared with third parties. Banking data flows one-way: env vars → AI prompt → patient message.

---

## Infrastructure Security

- The repository is **public** on GitHub. No sensitive data may be committed under any circumstances.
- Render.com environment variables are encrypted at rest and not exposed in build or deployment logs.
- The `/leads` and `/stats` endpoints are **unauthenticated debug endpoints** — they expose all in-memory patient data and must be restricted or removed before the line is made public.

---

## Known Limitations

| Limitation                      | Risk                                         | Recommended mitigation                                    |
|---------------------------------|----------------------------------------------|-----------------------------------------------------------|
| In-memory CRM                   | Patient data lost on restart; no audit trail | Migrate to persistent store via `crm.js` interface        |
| No rate limiting on `/webhook`  | Potential abuse or flooding                  | Add per-IP rate limiting middleware before public launch  |
| Unauthenticated debug endpoints | `/leads` and `/stats` expose patient data    | Add auth middleware or remove endpoints before going live |

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project:

1. **Do not open a public GitHub issue.**
2. Contact the repository owner directly via GitHub private message.
3. Include: description of the vulnerability, steps to reproduce, and potential impact.
4. Allow reasonable time for assessment and remediation before any public disclosure.

All reports are taken seriously and will receive a response within **5 business days**.