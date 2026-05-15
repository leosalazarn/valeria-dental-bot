# 🗺️ Valeria AI — Project Plan & Roadmap

This document tracks the evolution of Valeria, the AI Assistant for **Dra. Yuri Quintero**.

## 📊 Current Status: **Phase 3 — Conversion**

**Last Update:** May 15, 2026
**Overall Progress:** ~40% to Production Launch

---

## ✅ Phase 1: Stabilization (COMPLETE)

*Goal: Core functionality, basic CRM integration, and bug fixing.*

- [x] Fix phase transition bugs and "voice" consistency.
- [x] Implement Supabase (PostgreSQL) lead storage.
- [x] Adaptive debounce (5s) and deduplication (60s).
- [x] Basic dynamic prompt builder.
- [x] Centralized business rules in `config.js`.

---

## ✅ Phase 2: Security & Robustness (COMPLETE)

*Goal: Protect patient data, prevent AI abuse, and prepare for high traffic.*

- [x] **Guardrails:** Prevent prompt injection, jailbreaks, and off-topic chatter.
- [x] **Endpoint Auth:** Secure `/leads`, `/stats`, and `/metrics` with `DEBUG_API_KEY`.
- [x] **Anti-Flood:** Limit message bursts to 10 messages per session.
- [x] **Sanitization:** Clean user input from control characters.
- [x] **Refactor:** Remove all hardcoded logic into `src/config.js`.
- [x] **DB Persistence:** Robust lead storage with Supabase (zero-data-loss).

---

## 🔄 Phase 3: Conversion (CURRENT)

*Goal: Optimize the funnel from "Interested Lead" to "Paying Patient".*

- **Enhanced Re-engagement:** Implement different strategies based on why the patient stopped talking (Price objection
  vs. Timing).
- **Meta Verification:** Finalize App Review and switch to the permanent Production Number.
- **Render Upgrade:** Move to a $7/mo instance to prevent "cold starts" and ensure 24/7 responsiveness.
- **Lead Dashboard:** Create a simpler view or Google Sheets export for the human team to follow up.

---

## 🚀 Phase 4: Automation (2-3 Months)

*Goal: Remove manual steps from the doctor's team.*

- **DentalLink Integration:** Connect with the clinic's software to check real availability.
- **Automated Scheduling:** Let Valeria book the actual slot in the calendar.
- **Human handoff signal:** Add `[HANDOFF_TO_HUMAN]` intent detection so Valeria gracefully routes patients to a human
  when needed.
- **Media Handling:** Photos/videos of real cases via Meta Media API.

---

## 📈 Phase 5: Scale & Analytics (3-6 Months)

*Only if >500 consultations/month or multiple clinics.*

- **Voice Messages:** Integrate STT (Speech-to-Text) to allow patients to send audio notes.
- **Analytics Engine:** Deep sentiment analysis to detect "high-intent" patients automatically.

---

## 🧰 Phase 6: Tooling & DX (Ongoing)

*Goal: Improve operational visibility and team experience.*

- **Lead Dashboard UI:** Build a lightweight frontend (vanilla HTML/JS or simple SPA) that consumes `/debug/leads`,
  `/debug/stats`, and `/debug/metrics` via `x-api-key` auth. Display funnel conversion rates, drop-off by phase,
  response times, and lead list in an intuitive dashboard with charts and filters.
- **Real-time Notifications:** Push alerts to the clinic team when a lead reaches PAYMENT or CLOSING phase (via email,
  Slack webhook, or dashboard badge).
- **Export to CSV:** Add a download button to export leads data for offline analysis or Google Sheets import.
- **Session Inspector:** Admin panel to view individual conversation history, phase transitions, and re-engagement
  status per lead.

---

---

## 🏗️ Phase 7: Bridge Strategy — Distributed AI (6-12 Months)

*Goal: Evolve from Node.js monolith to distributed Bridge Architecture (Java 21 + Python AI microservices).*

- **Strangler Fig extraction:** Identify and extract one AI-heavy module (e.g., intent parsing or patient qualification) into a Python/FastAPI microservice.
- **Python AI Microservice:** FastAPI + Pydantic v2 + LangGraph for LLM orchestration. Communicate with Node.js core via HTTP/gRPC.
- **Java 21 Backend:** Spring Boot 3.2+ for auth, persistence, transactions. Virtual Threads (Project Loom), ZGC/G1 GC.
- **Kafka Event Bus:** Async communication between Bridge layers. Partition keys, offset management, headers.
- **LangChain4j:** Java-side LLM integration for non-AI-heavy tasks (classification, extraction).
- **Infrastructure as Code:** Terraform/Terragrunt for AWS EKS cluster, service mesh, and monitoring.

---

## ☁️ Phase 8: Enterprise AI Infrastructure (6-12 Months)

*Goal: Production-grade AI infrastructure on AWS with Bedrock, RAG, and Knowledge Bases.*

- **Amazon Bedrock Knowledge Base:** Create a document corpus in S3 (treatments, procedures, FAQs, pricing). Sync to Bedrock KB for RAG-powered retrieval.
- **RAG Pipeline:** Python/FastAPI service queries Bedrock `retrieve_and_generate` for accurate, context-aware responses.
- **OpenSearch Serverless:** Vector store for embeddings — semantic search over the clinic's treatment portfolio.
- **Knowledge Base docs:** Maintain canonical markdown files under `docs/knowledge-base/` as the single source of truth for all clinical and pricing data.
- **Enterprise Observability:** CloudWatch, X-Ray tracing across the Bridge layers, custom metrics for latency and cost per query.
- **Cost Optimization:** Bedrock Provisioned Throughput vs. On-Demand analysis. Cache frequently accessed KB queries.

---

## ⏰ Maintenance Deadlines

| Date             | Item                     | Status    | Action                                                                                                                                                                                                       |
|------------------|--------------------------|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Oct 30, 2026** | Supabase Data API grants | ⬜ Pending | Run `scripts/02_security.sql` (has GRANTs for anon/authenticated/service_role). Without it, supabase-js returns 42501 — all table access blocked. Can also switch to `service_role` key for better security. |

## 🛠️ Tech Stack Reminder

See [TECH_STACK.md](./reference/TECH_STACK.md) for the full stack and constants.
