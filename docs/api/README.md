# API Documentation — Valeria Dental Bot

## Base URL

`https://valeria-dental-bot.onrender.com`

## Endpoints

### `GET /debug/` — Health Check

**Auth:** None  
**Response:**

```json
{
  "status": "🦷 Valeria activa",
  "service": "Dra. Yuri Quintero — Perfeccionamiento dental ...",
  "hora": "12/05/2026, 3:45:00 p. m."
}
```

### `GET /webhook` — Meta Webhook Verification

**Auth:** None (query params)  
**Params:** `hub.mode`, `hub.verify_token`, `hub.challenge`  
**Response:** `200` with challenge string, or `403`

### `POST /webhook` — Receive WhatsApp Message

**Auth:** Meta signature (implicit via webhook URL)  
**Body:** Meta WhatsApp Cloud API webhook payload  
**Response:** `200` (immediate), processing happens asynchronously

### `GET /debug/leads` — All Patients

**Auth:** `x-api-key` header matching `DEBUG_API_KEY`  
**Response:** `{ "patients": [...] }`

### `GET /debug/stats` — Lead Statistics

**Auth:** `x-api-key` header  
**Response:** `{ "total_leads": N, "by_source": {}, "by_status": {}, "by_intent": {} }`

### `GET /debug/metrics` — Funnel Analytics

**Auth:** `x-api-key` header  
**Response:**

```json
{
  "total_sessions": 10,
  "funnel": {
    "START": {
      "count": 10,
      "rate": "100%"
    },
    "EXTRACTION": {
      "count": 10,
      "rate": "100%"
    },
    "HOOK": {
      "count": 10,
      "rate": "100%"
    },
    "DATA_CAPTURE": {
      "count": 10,
      "rate": "100%"
    },
    "PAYMENT": {
      "count": 10,
      "rate": "100%"
    },
    "CLOSING": {
      "count": 10,
      "rate": "100%"
    }
  },
  "dropoff": {
    "START → EXTRACTION": {
      "lost": 10,
      "drop_rate": "0%"
    }
  },
  "response_time": {
    "avg_first_response_ms": 10,
    "avg_first_response_s": "N"
  },
  "reengagement": {
    "sent": 10,
    "recovered": 10,
    "recovery_rate": "N%"
  }
}
```

## Error Codes

| Code | Meaning                     |
|------|-----------------------------|
| 200  | Success                     |
| 401  | Missing/invalid x-api-key   |
| 403  | Webhook verification failed |
