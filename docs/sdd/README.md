# Software Design Document — Valeria Dental Bot

## Version History

| Version | Date       | Author            | Changes                    |
|---------|------------|-------------------|----------------------------|
| 1.0     | 2026-05-12 | Leonardo Salazar  | Initial version            |

---

## 1. Introduction

### 1.1 Purpose
Valeria is an AI-powered WhatsApp bot for **Dra. Yuri Quintero's** aesthetic dentistry practice. It captures leads from Meta ads, qualifies them, collects patient data, and guides deposit payment for consultation appointments.

### 1.2 Scope
- **In scope:** Lead qualification, data capture, payment guidance, re-engagement, analytics
- **Out of scope:** Appointment scheduling (human receptionist), treatment pricing, clinical diagnosis

### 1.3 Definitions
| Term          | Definition                                                                            |
|---------------|---------------------------------------------------------------------------------------|
| Lead          | A person who messages the clinic's WhatsApp number                                    |
| Phase         | Stage in the conversion funnel (EXTRACTION → HOOK → DATA_CAPTURE → PAYMENT → CLOSING) |
| Signal        | Internal AI annotation (NAME:/GOAL:/EXTRACTED:) stripped before delivery              |
| Re-engagement | Automated follow-up message after 24h of silence                                      |

---

## 2. Architecture

### 2.1 High-Level Design

```
Patient → WhatsApp → Meta Cloud API → Webhook POST → Express Server
                                                          │
                                              ┌───────────┼───────────┐
                                              │           │           │
                                              ▼           ▼           ▼
                                         classifier    flow.js    session.js
                                              │           │           │
                                              ▼           ▼           ▼
                                                       ai.js ────→ Claude API
                                                         │
                                                         ▼
                                                     intent.js ──→ Supabase CRM
                                                         │
                                                         ▼
                                                    whatsapp.js ──→ Patient
```

### 2.2 Design Decisions

| Decision                     | Rationale                                                             |
|------------------------------|-----------------------------------------------------------------------|
| Dedicated WhatsApp line      | Every message is a potential patient — no trigger filtering needed    |
| Phase-based flow             | Hardcoded hooks reduce AI hallucination at critical conversion points |
| In-memory session + Supabase | Low-latency reads with persistence across restarts                    |
| AI signal extraction         | Claude appends NAME:/GOAL: — avoids separate NER model                |
| 3-line message limit         | WhatsApp best practice for engagement rates                           |

---

## 3. Module Map

See [PROJECT_FILES.md](../PROJECT_FILES.md) for detailed module descriptions.

| Layer       | Module              | Responsibility                                  |
|-------------|---------------------|-------------------------------------------------|
| Entry       | `server.js`         | Express init, route mounting                    |
| Routes      | `routes/webhook.js` | Meta verification + inbound messages + debounce |
| Routes      | `routes/debug.js`   | Health check, lead list, stats, funnel metrics  |
| Business    | `flow.js`           | Main pipeline orchestration                     |
| Business    | `classifier.js`     | 4-rule message classification                   |
| Business    | `intent.js`         | Signal parsing + CRM upsert                     |
| AI          | `ai.js`             | Claude API wrapper with retry                   |
| AI          | `prompt.js`         | Dynamic system prompt builder                   |
| Data        | `crm.js`            | Supabase patient CRUD                           |
| Data        | `session.js`        | Supabase conversation store                     |
| Integration | `whatsapp.js`       | Meta Cloud API sender                           |
| Utility     | `utils/logger.js`   | Emoji-prefixed logging                          |
| Utility     | `utils/time.js`     | Colombia timezone helpers                       |

---

## 4. Data Model

### 4.1 Patients Table
| Column                                | Type    | Notes                                   |
|---------------------------------------|---------|-----------------------------------------|
| phone                                 | TEXT PK | WhatsApp number                         |
| name                                  | TEXT    | Detected during EXTRACTION              |
| aesthetic_goal                        | TEXT    | Dental goal detected by AI              |
| status                                | TEXT    | NEW → PROSPECT → CONSULTATION_SCHEDULED |
| source                                | TEXT    | DIRECT or ORGANIC                       |
| data_complete                         | BOOLEAN | All 3 fields captured                   |
| full_name, email, consultation_reason | TEXT    | Captured in DATA_CAPTURE phase          |

### 4.2 Conversations Table
| Column  | Type    | Notes                                                        |
|---------|---------|--------------------------------------------------------------|
| phone   | TEXT PK | Foreign key-like relationship                                |
| phase   | TEXT    | START → EXTRACTION → HOOK → DATA_CAPTURE → PAYMENT → CLOSING |
| history | JSONB   | Sliding window of 20 messages                                |
| metrics | JSONB   | Timestamps, response times, re-engagement tracking           |

---

## 5. API Design

| Method | Route            | Auth           | Purpose                         |
|--------|------------------|----------------|---------------------------------|
| GET    | `/webhook`       | None           | Meta webhook verification       |
| POST   | `/webhook`       | Meta signature | Receive WhatsApp messages       |
| GET    | `/debug/`        | None           | Health check                    |
| GET    | `/debug/leads`   | x-api-key      | All patients                    |
| GET    | `/debug/stats`   | x-api-key      | Summary by source/status/intent |
| GET    | `/debug/metrics` | x-api-key      | Funnel analytics                |

---

## 6. Security Architecture

- **Prompt guardrails** reject jailbreaks, topic diversion, roleplay
- **Anti-flood** caps at 10 messages per burst with 5s debounce
- **Deduplication** prevents Meta retry duplicates (60s TTL)
- **Signal stripping** removes internal annotations before delivery
- **Webhook challenge** sanitized to numeric-only before reflection
- **Non-text rejection** blocks media, locations, contacts from AI pipeline

---

## 7. Deployment

See [README.md](../../README.md) for deployment instructions.
