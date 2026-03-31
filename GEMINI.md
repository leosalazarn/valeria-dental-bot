# GEMINI.md — Valeria WhatsApp Bot · Dra. Yuri Quintero

## 1. Project Context
**Valeria** is an AI-powered WhatsApp bot for **Dra. Yuri Quintero's** aesthetic dentistry practice in Neiva, Colombia.
- **Goal:** Qualify leads from Meta ads, capture patient data, and guide them to pay a deposit for a consultation.
- **Tone:** Informal Colombian Spanish ("tú"), warm, professional, maximum 3 lines per message, maximum 1 emoji.

## 2. Technical Stack
- **Runtime:** Node.js + Express (ES Modules)
- **AI:** Anthropic Claude (Sonnet 4.6) via `src/ai.js`
- **Database:** Supabase (PostgreSQL) via `src/crm.js`
- **Testing:** Vitest (`npm test`)
- **Messaging:** Meta Cloud API via `src/whatsapp.js`

## 3. Absolute Business Rules (CRITICAL)
- ❌ **NO exact prices:** Only approximate ranges from `config.js`.
- ❌ **NO ID/Phone requests:** Phone is known; ID is never asked.
- ❌ **NO scheduling:** Valeria captures data only; humans confirm appointments.
- ✅ **Gender:** Dra. Yuri is female ("la doctora").
- ✅ **Deposit:** Required for confirmation (prices in `config.js`).

## 4. Engineering Standards
- **Modules:** Use ES Modules (`import/export`). No CommonJS.
- **Async:** Always use `async/await` with `try/catch` blocks.
- **Constants:** Centralize all business logic and user-facing text in `src/config.js`.
- **Logging:** Use `src/utils/logger.js` with specific emoji prefixes.
- **Testing:** New features or bug fixes MUST include Vitest tests in `tests/`.

## 5. Development Workflow
1.  **Research:** Read `CLAUDE.md` and `PROJECT_FILES.md` for context.
2.  **Strategy:** Propose changes before implementation.
3.  **Execute:** Surgical edits to relevant modules in `src/`.
4.  **Validate:** Run `npm test` and verify no hardcoded strings or sensitive data leaks.

## 6. Conversation Flow (flow.js)
`EXTRACTION` → `HOOK` → `DATA_CAPTURE` → `PAYMENT` → `CLOSING`
- **Re-engagement:** 24h timer triggers specific follow-ups based on current phase.
- **Signals:** AI appends internal signals (e.g., `NAME: [name]`) which are stripped by `stripSignals()` before sending.

## 7. Key Commands
- `npm test`: Run all Vitest suites.
- `npm start`: Start the production server.
- `npm run dev`: Start with nodemon (if configured).

---
*Created 31/03/2026. This file takes precedence over general defaults.*
