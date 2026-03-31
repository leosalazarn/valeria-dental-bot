// Configuration module — centralized env vars and constants
import 'dotenv/config';

// ── Validate required env vars at startup
const requiredEnvVars = [
    'ANTHROPIC_API_KEY', 'WA_ACCESS_TOKEN', 'WA_PHONE_NUMBER_ID', 'VERIFY_TOKEN',
    'BANK_HOLDER_NAME', 'BANK_HOLDER_CC',
    'BANCOLOMBIA_ACCOUNT', 'NEQUI_NUMBER', 'DAVIVIENDA_ACCOUNT',
    'SUPABASE_URL', 'SUPABASE_ANON_KEY',
    'CONSULTATION_PRICE', 'BOOK_PRICE', 'MIN_RANGE_PRICE', 'MAX_RANGE_PRICE'
];
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
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// ── Claude Configuration
export const CLAUDE_MODEL = 'claude-sonnet-4-6';
export const MAX_TOKENS = 450;

// ── Session Configuration
export const MAX_HISTORY = 20;
export const SESSION_EXPIRY_HOURS = 24;
export const CLEANUP_INTERVAL_MINUTES = 60;
export const REENGAGEMENT_DELAY_HOURS = 24;
export const REENGAGEMENT_DELAY_MINUTES = REENGAGEMENT_DELAY_HOURS * 60;

// ── Timezone
export const COLOMBIA_TIMEZONE = 'America/Bogota';

// ── Practice Info
export const PRACTICE_NAME = 'Dra. Yuri Quintero — Perfeccionamiento dental #OdontologíaHechaConAmor';
export const PRACTICE_LOCATION = 'Neiva, Huila, Colombia';
export const CONSULTATION_PRICE = Number(process.env.CONSULTATION_PRICE);
export const BOOK_PRICE = Number(process.env.BOOK_PRICE);
export const MIN_RANGE_PRICE = Number(process.env.MIN_RANGE_PRICE);
export const MAX_RANGE_PRICE = Number(process.env.MAX_RANGE_PRICE);
export const CONSULTATION_CURRENCY = 'Pesos';
export const CONSULTATION_DURATION_MINUTES = 30;

// All prices in COP. These are ranges — exact price depends on diagnosis.
export const TREATMENT_PRICES = {
    'default':                  { min: MIN_RANGE_PRICE,  max: MAX_RANGE_PRICE, note: 'varía según diagnóstico' },
};

// ── Banking Info
export const BANK_HOLDER_NAME = process.env.BANK_HOLDER_NAME;
export const BANK_HOLDER_CC = process.env.BANK_HOLDER_CC;
export const BANCOLOMBIA_ACCOUNT = process.env.BANCOLOMBIA_ACCOUNT;
export const NEQUI_NUMBER = process.env.NEQUI_NUMBER;
export const DAVIVIENDA_ACCOUNT = process.env.DAVIVIENDA_ACCOUNT;

// ── Hardcoded Messages (all user-facing text centralized here)
export const MSG_NON_TEXT = 'Por ahora solo puedo leer mensajes de texto 😊 ¿Me escribes lo que necesitas?';

export const MSG_REENGAGEMENT_HOOK = (name) =>
    `${name}, ¿te gustaría ver resultados de pacientes con un caso similar al tuyo? ✨`;

export const MSG_REENGAGEMENT_EXTRACTION = (name) =>
    `${name}, quedé pensando en lo que me contaste 🦷 ¿Pudiste resolver tus dudas? Aquí estamos para ayudarte.`;

export const MSG_REENGAGEMENT_DATA_CAPTURE = (name) =>
    `${name}, tengo todo listo para reservar tu cita ✨ ¿Me confirmas tus datos para asegurarte el cupo?`;

export const MSG_REENGAGEMENT = (name) =>
    `${name}, ¿te gustaría ver resultados de pacientes con un caso similar al tuyo? ✨`;

export const MSG_HOOK = (name) =>
    `¡Qué bueno, ${name}! La Dra. Yuri es especialista exactamente en eso 🌟\n` +
    `La valoración dura ${CONSULTATION_DURATION_MINUTES} min e incluye examen completo, tu plan de tratamiento y más — todo por $${CONSULTATION_PRICE.toLocaleString('es-CO')} que se abonan al tratamiento. ¿Te la agendamos?`;

export const MSG_DATA_CAPTURE = (aestheticGoal) => {
    const motivo = aestheticGoal
        ? `\n(Motivo de consulta ya lo tenemos: ${aestheticGoal} ✅ — solo confirma si es correcto)`
        : '\n• Motivo de consulta';
    return `¡Perfecto! Solo necesito un par de datos para reservar tu cita con la Dra. Yuri 😊\n\n• Nombre completo\n• Correo electrónico \n• ${motivo}`;
};