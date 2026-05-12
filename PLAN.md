# 🗺️ Valeria AI — Project Plan & Roadmap

This document tracks the evolution of Valeria, the AI Assistant for **Dra. Yuri Quintero**.

## 📊 Current Status: **Phase 2 (Final Stabilization)**
**Last Update:** May 12, 2026
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
- **Pricing Logic:** Add specific ranges for different treatments (Resins, Lenses, etc.) in `config.js`.
- **Enhanced Re-engagement:** Implement different strategies based on why the patient stopped talking (Price objection vs. Timing).
- **Meta Verification:** Finalize App Review and switch to the permanent Production Number.
- **Render Upgrade:** Move to a $7/mo instance to prevent "cold starts" and ensure 24/7 responsiveness.
- **Lead Dashboard:** Create a simpler view or Google Sheets export for the human team to follow up.

---

## 🚀 Phase 4: Automation (2-3 Months)
*Goal: Remove manual steps from the doctor's team.*
- **DentalLink Integration:** Connect with the clinic's software to check real availability.
- **Automated Scheduling:** Let Valeria book the actual slot in the calendar.
- **Media Handling:** Process photos sent by patients via Meta Media API for preliminary visual assessment.

---

## 📈 Phase 5: Scale (Long Term)
*Goal: Handle hundreds of daily conversations and multiple clinics.*
- **RAG System:** Move clinical knowledge to a Vector Database for more precise medical FAQs.
- **Analytics Engine:** Deep sentiment analysis to detect "high-intent" patients automatically.
- **Voice Messages:** Integrate STT (Speech-to-Text) to allow patients to send audio notes.

---

## 🛠️ Tech Stack Reminder
- **Runtime:** Node.js (ES Modules)
- **AI:** Anthropic Claude 3.5 Sonnet
- **Database:** Supabase (PostgreSQL)
- **Infrastructure:** Render (Hosting) + Meta Cloud API (WhatsApp)
