# Security Policy — Valeria WhatsApp Bot

## Scope

This document covers the security posture of the Valeria WhatsApp bot, including credential management, data handling, patient privacy, and vulnerability reporting.

---

## Supported Versions

Only the latest version deployed on Render.com is actively maintained and receives security updates.

---

## Sensitive Data Policy

### What is considered sensitive

| Data type               | Classification   | Storage              |
|-------------------------|------------------|----------------------|
| Anthropic API key       | Critical         | Render env vars only |
| Meta access token       | Critical         | Render env vars only |
| Webhook verify token    | Critical         | Render env vars only |
| Banking account numbers | Critical         | Render env vars only |
| Account holder name/ID  | Sensitive        | Render env vars only |
| Patient names           | Personal         | In-memory, 24h TTL   |
| Patient emails          | Personal         | In-memory, 24h TTL   |
| WhatsApp phone numbers  | Personal         | In-memory, 24h TTL   |
| Consultation reasons    | Personal/Medical | In-memory, 24h TTL   |

### Rules

- **No sensitive data in source code** — ever. Use environment variables exclusively.
- **No sensitive data in `CLAUDE.md` or any documentation file** committed to the repository.
- **No sensitive data in logs** — `logger.js` only logs phone number prefixes and truncated message text.
- **Banking details** are injected into the AI prompt at runtime from environment variables and are never stored in files or version control.
- **Patient data** lives only in the in-memory CRM Map and is automatically purged after 24 hours of inactivity.

---

## Credential Management

### API Keys

- All credentials are stored exclusively as **Render environment variables**.
- The `.env` file is listed in `.gitignore` and must never be committed.
- `.env.example` contains only placeholder keys (`...`) — no real values.
- The Meta access token should be a **permanent token** generated via Meta Business Suite → System Users. Temporary tokens (24h expiry) should only be used during development.

### Rotation Policy

| Credential        | Rotation trigger                              |
|-------------------|-----------------------------------------------|
| Anthropic API key | Suspected exposure or team member offboarding |
| Meta access token | Suspected exposure or Meta policy change      |
| Verify token      | Suspected exposure                            |
| Banking data      | Account change by clinic                      |

---

## Input Validation & Injection Prevention

- **Webhook challenge sanitization** — the `hub.challenge` parameter from Meta is validated against `/^\d+$/` before being reflected in the response, preventing XSS via the verification endpoint.
- **Non-text message handling** — audio, images, and documents are rejected before reaching the AI pipeline; only `type === 'text'` messages are processed.
- **Message debounce** — consecutive messages are buffered for 10 seconds and processed as one, preventing prompt injection via message flooding.
- **Signal stripping** — internal AI signals (`NAME:`, `GOAL:`, `EXTRACTED:`) are stripped from responses before delivery to the patient via `stripSignals()`.

---

## Patient Privacy

- Valeria is a **dedicated WhatsApp line** — only the clinic's number is registered. The bot does not respond on personal or shared numbers.
- Patient conversations are stored **in memory only** — no database persistence by default. Data is lost on server restart.
- The bot **never asks for national ID (cédula)** or additional phone numbers. The WhatsApp number is the only identifier collected.
- Conversation history uses a **sliding window of 20 messages** — older messages are automatically discarded.
- The bot does not share patient data with third parties. Banking data flows one-way: from env vars → AI prompt → patient message.

---

## Infrastructure Security

- The repository is **public** on GitHub. No sensitive data should ever be committed.
- Render.com environment variables are **encrypted at rest** and not visible in build logs.
- The Express server does not expose any admin endpoints without authentication — `/leads` and `/stats` are debug-only and should be removed or protected before high-volume production use.

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project:

1. **Do not open a public GitHub issue.**
2. Contact the repository owner directly via GitHub private message or email.
3. Include a description of the vulnerability, steps to reproduce, and potential impact.
4. Allow reasonable time for assessment and remediation before any public disclosure.

We take all reports seriously and will respond within 5 business days.

---

## Known Limitations

- **In-memory CRM** — patient data is not persisted across server restarts. A production deployment should migrate to a persistent store (see `crm.js`).
- **No rate limiting** — the `/webhook` endpoint does not enforce per-IP rate limits. Meta's own delivery guarantees provide some protection, but additional rate limiting is recommended for public-facing deployments.
- **Debug endpoints** — `/leads` and `/stats` expose all in-memory patient data without authentication. These must be restricted or removed before the line is made public.