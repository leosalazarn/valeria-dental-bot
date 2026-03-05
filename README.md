# 🦷 Valeria — AI Advisor · Dra. Yuri Quintero

24/7 virtual advisor for **Dra. Yuri Quintero**'s dental office, specialist in aesthetic dentistry in Neiva, Huila.  
Connected to WhatsApp Business. Responds in seconds, does not give prices, schedules valuations with the doctor.

---

## Stack

| Component | Technology | Cost |
|---|---|---|
| Server | Node.js + Express | — |
| AI Intelligence | Claude Haiku (Anthropic) | ~$2-4 USD/month |
| Channel | WhatsApp Business API (Meta) | Free* |
| Hosting | Render.com | $0-7 USD/month |
| **Total** | | **~$7-14 USD/month** |

---

## Local Setup (IntelliJ IDEA)

### 1. Clone the repository

```bash
git clone https://github.com/leosalazarn/valeria-dental-bot.git
cd valeria-dental-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the .env file

```bash
# On Windows (PowerShell):
copy .env.example .env
```

Open `.env` and fill in the 4 values. See **Environment Variables** section below.

### 4. Run in development mode

```bash
npm run dev
```

You will see in console:
```
🦷 Valeria listening on port 3000
📍 Aesthetic Dental Clinic · Neiva, Huila
```

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `WA_ACCESS_TOKEN` | Meta for Developers → your app → WhatsApp → API Setup |
| `WA_PHONE_NUMBER_ID` | Meta for Developers → WhatsApp → API Setup (it's a long number) |
| `VERIFY_TOKEN` | You invent it — any secret string |

---

## Deploy on Render.com

1. Upload the code to GitHub
2. [render.com](https://render.com) → **New Web Service** → connect your repo
3. Configure:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node
4. In **Environment Variables**, add the 4 variables from .env
5. Deploy → you get a URL like `https://valeria-dental.onrender.com`
6. Use that URL in Meta for Developers as webhook: `https://valeria-dental.onrender.com/webhook`

---

## Valeria's Guidelines

- ❌ **Never gives prices** via WhatsApp — redirects to valuation with Dra. Yuri
- ✅ **Valuation: $80.000 COP** — fully credited to the treatment
- 👩‍⚕️ **Doctor, not doctor** — always "Dra. Yuri" or "the doctor"
- 🕐 **Available 24/7** — same service at 3am as at 10am
- 🇨🇴 **Colombian Spanish** — warm, close, not corporate
- 🤝 **Handling objections** — price, fear of dentist, indecision

---

## Project Structure

```
valeria-dental-bot/
├── server.js          ← Main server + Valeria's logic
├── package.json       ← Dependencies
├── .env.example       ← Environment variables template
├── .env               ← Your secrets (DO NOT upload to GitHub)
├── .gitignore         ← Files ignored by Git
└── README.md          ← This guide
```

---

## Useful Commands

```bash
npm run dev     # Development with auto-reload
npm start       # Production
```
