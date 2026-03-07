// Configuration module — centralized env vars and constants
import 'dotenv/config';

// ── Validate required env vars at startup
const requiredEnvVars = ['ANTHROPIC_API_KEY', 'WA_ACCESS_TOKEN', 'WA_PHONE_NUMBER_ID', 'VERIFY_TOKEN'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`❌ Missing required environment variable: ${envVar}`);
    }
}

// ── API Configuration
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
export const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
export const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
export const PORT = process.env.PORT || 3000;

// ── Claude Configuration
export const CLAUDE_MODEL = 'claude-sonnet-4-6';
export const MAX_TOKENS = 450;

// ── Session Configuration
export const MAX_HISTORY = 20;
export const SESSION_EXPIRY_HOURS = 24;
export const CLEANUP_INTERVAL_MINUTES = 60;
export const REENGAGEMENT_DELAY_MINUTES = 30;

// ── Trigger Messages (pre-filled from Meta ads)
export const TRIGGERS = [
    "Quiero mejorar mi sonrisa",
    "Quiero información",
    "Quiero más información",
    "Me gustaría agendar",
    "Hola, me recomendaron contigo",
    "Quiero agendar",
    "Quiero agendar una cita",
    "Estoy interesado en una consulta",
    "Precio?",
    "Precio de un diseño de sonrisa?",
    "Que costo tiene?",
    "Que precio tiene?"
];

// ── Supplier Detection Keywords
export const SUPPLIER_KEYWORDS = [
    'invoice', 'supplies', 'order', 'dental deposit', 'payment request',
    'supplier quote', 'shipping', 'purchase order', 'tax id',
    'factura', 'insumos', 'pedido', 'cuenta de cobro', 'cotización'
];

// ── Timezone
export const COLOMBIA_TIMEZONE = 'America/Bogota';

// ── Practice Info
export const PRACTICE_NAME = 'Dra. Yuri Quintero — Odontología Estética';
export const PRACTICE_LOCATION = 'Neiva, Huila, Colombia';
export const CONSULTATION_PRICE = 80000;
export const BOOK_PRICE = 30000;
export const CONSULTATION_CURRENCY = 'Pesos';

