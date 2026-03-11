# 🦷 Valeria — AI Advisor for Aesthetic Dentistry

A production-ready WhatsApp Business AI chatbot that captures patient inquiries through Meta ads and qualifies leads for
consultation scheduling.

**Key Features:**

- 24/7 AI-powered WhatsApp assistant
- Lead capture from Meta Click-to-WhatsApp ads
- Intelligent message classification pre-processing
- Multiphase conversion flow with re-engagement automation
- Intent extraction and CRM tracking
- Modular, scalable architecture

## Technology Stack

- **Runtime**: Node.js + Express
- **AI**: Anthropic Claude API (claude-haiku-4-5-20251001)
- **Messaging**: Meta WhatsApp Business API
- **Data Storage**: In-memory Map

---

## Core Features

### Lead Capture

- Detects trigger messages from Meta Click-to-WhatsApp ads
- Classifies messages before AI processing (suppliers, returning patients, warm leads)
- Routes to appropriate conversation flow

### Intelligent Routing

- **Warm Leads** (from ads): High-energy engagement flow
- **Organic Leads**: Standard discovery flow
- **Returning Patients**: Patient care flow
- **Suppliers**: Administrative redirect

### Conversion Flow

- **Phase A**: Extract patient information (name, aesthetic goals)
- **Phase B**: Present consultation hook
- **Phase C**: Re-engagement automation (30-minute follow-up)

### Intent Analysis

Extracts intent from each interaction:

- Schedule request
- Information request
- Price objection
- Fear/concern objection
- Undecided
- Other

---

## Project Structure

```
valeria-dental-bot/
├── server.js                ← Express server entry point
├── package.json
├── .env.example
├── README.md
└── src/
    ├── config.js            ← Configuration & constants
    ├── crm.js               ← Patient CRM (in-memory)
    ├── session.js           ← Conversation sessions
    ├── classifier.js        ← Message classification
    ├── prompt.js            ← Dynamic system prompts
    ├── ai.js                ← Claude API integration
    ├── whatsapp.js          ← Meta WhatsApp API
    ├── intent.js            ← Intent extraction
    ├── flow.js              ← Conversation orchestration
    ├── routes/
    │   ├── webhook.js       ← Webhook handlers
    │   └── debug.js         ← Debug endpoints
    └── utils/
        ├── logger.js        ← Centralized logging
        └── time.js          ← Timezone utilities
```  

## Setup

### Prerequisites

- Node.js 18+
- Meta WhatsApp Business Account with API access
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/leosalazarn/valeria-dental-bot.git
   cd valeria-dental-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy template
   cp .env.example .env
   
   # Edit .env with your credentials
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```

   Server output:
   ```
   🦷 Valeria listening on port 3000
   👩‍⚕️ Aesthetic Dental Clinic
   🕐 [current time in clinic timezone]
   ```

---

## Environment Variables

Required environment variables in `.env`:

```
ANTHROPIC_API_KEY=your_anthropic_key
WA_ACCESS_TOKEN=your_meta_token
WA_PHONE_NUMBER_ID=your_phone_id
VERIFY_TOKEN=your_verification_token
PORT=3000 (optional, defaults to 3000)
```

See `.env.example` for full template.

---

## Deployment

### Deploy to Render.com

1. Push code to GitHub (ensure `.env` is in `.gitignore`)
2. Create new Web Service on Render.com
3. Connect your repository
4. Configure build & start commands:
    - **Build**: `npm install`
    - **Start**: `npm start`
5. Add environment variables in Render dashboard
6. Deploy — get production URL
7. Configure webhook in Meta for Developers: `https://your-app.onrender.com/webhook`

---

## API Endpoints

| Method | Endpoint   | Purpose                   |
|--------|------------|---------------------------|
| GET    | `/`        | Health check              |
| GET    | `/webhook` | Meta verification         |
| POST   | `/webhook` | Receive WhatsApp messages |
| GET    | `/leads`   | List all leads (debug)    |
| GET    | `/stats`   | Summary statistics        |

---

## Architecture Overview

The application is organized into **14 focused, independent modules** following single-responsibility principles.

### Module Organization

| Layer       | Modules                        | Responsibility                     |
|-------------|--------------------------------|------------------------------------|
| **Core**    | config, logger, time           | Configuration, logging, utilities  |
| **Storage** | crm, session                   | Patient data, conversation state   |
| **Logic**   | classifier, prompt, ai, intent | Message processing, AI integration |
| **Flow**    | flow                           | Conversation orchestration         |
| **API**     | routes/webhook, routes/debug   | HTTP handlers                      |

### Design Principles

✅ **Modular**: Each file ~30-90 lines, single responsibility  
✅ **Stateless**: Pure functions, no hidden dependencies  
✅ **Resilient**: try/catch on all async operations  
✅ **Efficient**: Auto-cleanup of inactive sessions, sliding window history  
✅ **Extensible**: CRM interface ready for any CRM integration
✅ **Documented**: Clear function signatures and data contracts

---

## Commands

```bash
npm install     # Install dependencies
npm start       # Production mode
npm run dev     # Development mode with auto-reload
```

---

## License

Proprietary — All rights reserved
