# API Endpoints — Valeria WhatsApp Bot

| Method | Route          | Purpose                              | Auth               |
|--------|----------------|--------------------------------------|--------------------|
| GET    | /debug/        | Health check                         | Public             |
| GET    | /webhook       | Meta verification                    | Public             |
| POST   | /webhook       | Receive WhatsApp messages            | Public             |
| GET    | /debug/leads   | All persistent patients (Supabase)   | x-api-key required |
| GET    | /debug/stats   | Summary by source/status/intent      | x-api-key required |
| GET    | /debug/metrics | Funnel & response time analytics     | x-api-key required |
