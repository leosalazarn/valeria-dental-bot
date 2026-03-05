// ============================================================
//  Valeria — AI Advisor · Dr. Yuri Quintero Dental Practice
//  Aesthetic Dentistry · Neiva, Huila, Colombia
//  WhatsApp Business API + Claude (Anthropic) + Google Sheets CRM
//  Deploy: Render.com
// ============================================================

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { google } from 'googleapis';
import 'dotenv/config';

const app = express();
app.use(express.json());

// ── Anthropic Client ────────────────────────────────────────
const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Google Sheets CRM ───────────────────────────────────────
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ── In-Memory Sessions (Map keyed by phone number) ──────────
const sessions = new Map(); // phone → { history, name, aesthetic_goal, phase, reengagement_timer }

// ── Constants ──────────────────────────────────────────────
const MAX_HISTORY = 20;
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 450;

// ── Google Sheets Functions ────────────────────────────────
async function findPatient(phone) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Patients!A:G',
    });

    const rows = response.data.values || [];
    const header = rows[0]; // Skip header
    const data = rows.slice(1);

    for (const row of data) {
      if (row[0] === phone) { // Column A: phone
        return {
          phone: row[0],
          name: row[1] || null,
          status: row[2] || 'NEW',
          aesthetic_goal: row[3] || null,
          first_contact_date: row[4] || null,
          last_interaction_date: row[5] || null,
          notes: row[6] || null,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Error finding patient:', error.message);
    return null;
  }
}

async function upsertPatient(data) {
  try {
    const existing = await findPatient(data.phone);
    const now = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

    if (existing) {
      // Update existing
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Patients!A:A',
      });

      const rows = response.data.values || [];
      let rowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.phone) {
          rowIndex = i + 1; // +1 because sheets are 1-indexed
          break;
        }
      }

      if (rowIndex > 0) {
        const updateData = [
          data.phone,
          data.name || existing.name,
          data.status || existing.status,
          data.aesthetic_goal || existing.aesthetic_goal,
          existing.first_contact_date || now,
          now, // last_interaction_date
          data.notes || existing.notes,
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: `Patients!A${rowIndex}:G${rowIndex}`,
          valueInputOption: 'RAW',
          resource: { values: [updateData] },
        });
      }
    } else {
      // Insert new
      const newData = [
        data.phone,
        data.name || null,
        data.status || 'NEW',
        data.aesthetic_goal || null,
        now, // first_contact_date
        now, // last_interaction_date
        data.notes || null,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Patients!A:G',
        valueInputOption: 'RAW',
        resource: { values: [newData] },
      });
    }
  } catch (error) {
    console.error('❌ Error upserting patient:', error.message);
  }
}

// ── Classification Logic (Pre-processing) ──────────────────
function classifyMessage(phone, text, chatType) {
  // RULE 1: Ignore group messages
  if (chatType === 'group') {
    return { action: 'IGNORE', reason: 'group_message' };
  }

  // RULE 2: Supplier detection
  const supplierKeywords = [
    'invoice', 'supplies', 'order', 'dental deposit', 'payment request',
    'supplier quote', 'shipping', 'purchase order', 'tax id'
  ];

  if (supplierKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
    return { action: 'SUPPLIER', reason: 'supplier_keywords' };
  }

  // RULE 3: Check if patient is in treatment
  const patient = findPatient(phone);
  if (patient && patient.status === 'IN_TREATMENT') {
    return { action: 'CURRENT_PATIENT', reason: 'in_treatment' };
  }

  // RULE 4: New lead or prospect
  return { action: 'NEW_LEAD', reason: 'default_flow' };
}

// ── Dynamic System Prompt Builder ──────────────────────────
function buildSystemPrompt(session) {
  const basePrompt = `Eres Valeria, asesora del consultorio de la Dra. Yuri Quintero, especialista en odontología estética en Neiva, Huila, Colombia. Estás disponible 24/7.

## TU PERSONALIDAD
- Cálida, empática, genuinamente interesada en cada persona
- Hablas en español colombiano natural: usas "usted" con respeto pero suenas cercana
- Emojis con moderación (máximo 1-2 por mensaje), solo cuando añaden calidez
- NUNCA suenas a robot ni a respuesta automática
- Sentido del humor sutil cuando apropiado
- Mensajes cortos: máximo 4-5 líneas, sin listas ni asteriscos
- Termina con pregunta cuando sea natural

## REGLA ABSOLUTA — NUNCA DAS PRECIOS
BAJO NINGUNA CIRCUNSTANCIA das precios, rangos o estimados por WhatsApp.
Siempre respondes: "Los precios los maneja directamente la Dra. Yuri en la valoración, porque dependen del diagnóstico de cada caso — no son iguales para todos."

## CONSULTA INICIAL
- Cuesta $80.000 COP
- Se acredita 100% al tratamiento
- Incluye diagnóstico personalizado con la Dra. Yuri

## PRINCIPIOS DE PERSUASIÓN (Cialdini)
- ESCASEZ: Menciona disponibilidad limitada cuando natural
- PRUEBA SOCIAL: Referencia resultados de otros pacientes
- AUTORIDAD: Refuerza experiencia de la Dra. Yuri

## MANEJO DE OBJECIONES
- Dolor: "Los procedimientos de la Dra. Yuri son mínimamente invasivos — la mayoría de pacientes se sorprende por lo cómodo que fue."
- Precio: "Nuestra práctica trae estética de alta calidad a presupuestos reales. En la consulta la Dra. Yuri diseñará un plan exacto para tu caso."
- Miedo al dentista: "Es completamente válido. La consulta es solo conversación y revisión — sin procedimientos. La Dra. Yuri es muy gentil."
- "¿Eres un bot?": "Soy una asistente virtual — bastante humana, espero 😊 Para temas médicos te conecto directamente con el equipo."

## DATOS DEL CONSULTORIO
- Nombre: Consultorio Dra. Yuri Quintero — Odontología Estética
- Ubicación: Neiva, Huila, Colombia
- Horarios presenciales: lunes a viernes 8am–6pm, sábados 9am–1pm`;

  // Add session context if available
  let contextPrompt = '';
  if (session.name) {
    contextPrompt += `\n\nEl nombre del paciente es: ${session.name}`;
  }
  if (session.aesthetic_goal) {
    contextPrompt += `\n\nSu objetivo estético es: ${session.aesthetic_goal}`;
  }

  return basePrompt + contextPrompt;
}

// ── Current Patient Care Prompt ────────────────────────────
function buildCurrentPatientPrompt() {
  return `Eres Valeria, asistente del consultorio de la Dra. Yuri Quintero.
Estás respondiendo a un paciente que actualmente está en tratamiento.

## TU ROL
- Responde preguntas post-tratamiento, instrucciones de cuidado, reagendamientos
- Mantén el mismo tono cálido y empático
- Para temas médicos complejos, conecta con el equipo humano
- Recuerda: nunca das precios ni tratamientos sin supervisión médica

## INSTRUCCIONES ESPECÍFICAS
- Si preguntan por cuidado post-tratamiento: da consejos generales pero recomienda consultar con el equipo
- Si necesitan reagendar: captura la información y menciona que el equipo se pondrá en contacto
- Si tienen complicaciones: urge contactar al consultorio inmediatamente
- Mantén respuestas cortas y útiles`;
}

// ── Intent Extraction ──────────────────────────────────────
function extractIntent(phone, response, session) {
  const intent = {
    phone,
    name: session.name,
    aesthetic_goal: session.aesthetic_goal,
    intent: 'OTHER',
    current_phase: session.phase || 'START',
    requires_human: false,
    timestamp: new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })
  };

  const lowerResponse = response.toLowerCase();

  // Detect intent from response
  if (lowerResponse.includes('agendar') || lowerResponse.includes('semana') || lowerResponse.includes('disponibilidad')) {
    intent.intent = 'SCHEDULE';
    intent.requires_human = true;
  } else if (lowerResponse.includes('precio') || lowerResponse.includes('cuánto') || lowerResponse.includes('costo')) {
    intent.intent = 'PRICE_OBJECTION';
  } else if (lowerResponse.includes('miedo') || lowerResponse.includes('dolor') || lowerResponse.includes('ansiedad')) {
    intent.intent = 'FEAR_OBJECTION';
  } else if (lowerResponse.includes('pienso') || lowerResponse.includes('decidir') || lowerResponse.includes('duda')) {
    intent.intent = 'UNDECIDED';
  } else if (lowerResponse.includes('información') || lowerResponse.includes('saber más')) {
    intent.intent = 'REQUEST_INFO';
  }

  console.log(`📊 LEAD:`, JSON.stringify(intent, null, 2));

  // Update patient in Sheets
  upsertPatient({
    phone,
    name: session.name,
    status: session.phase === 'CLOSING' ? 'CONSULTATION_SCHEDULED' : 'PROSPECT',
    aesthetic_goal: session.aesthetic_goal,
    notes: `Intent: ${intent.intent} | Phase: ${intent.current_phase}`
  });

  return intent;
}

// ── Conversion Flow Logic ──────────────────────────────────
function handleConversionFlow(phone, session, userMessage) {
  const phase = session.phase || 'START';

  // Phase A: Data extraction
  if (!session.name || !session.aesthetic_goal) {
    session.phase = 'EXTRACTION';
    return null; // Let AI handle natural extraction
  }

  // Phase B: Hook delivery
  if (phase === 'EXTRACTION' && session.name && session.aesthetic_goal) {
    session.phase = 'HOOK';

    // Start reengagement timer (30 minutes)
    if (session.reengagement_timer) {
      clearTimeout(session.reengagement_timer);
    }

    session.reengagement_timer = setTimeout(() => {
      const reengagementMessage = `He estado pensando en tu caso, ${session.name} 😊 ¿Te gustaría ver fotos de resultados similares al tuyo antes de agendar? Muchos pacientes se deciden una vez que ven los antes y después.`;

      enviarMensaje(phone, reengagementMessage);
      console.log(`⏰ Reengagement sent to ${phone}`);
    }, 30 * 60 * 1000); // 30 minutes

    return `Entiendo, ${session.name}. Muchos de nuestros pacientes estaban buscando exactamente eso y lo lograron con nuestro protocolo. Para asegurarme de que seas la candidata ideal, la Dra. Yuri necesita verte para una consulta de 15 minutos — y lo mejor es que los $80.000 se acreditan completamente a tu tratamiento.
¿Te gustaría agendar esta semana?`;
  }

  // Phase C: Closing
  if (phase === 'HOOK') {
    session.phase = 'CLOSING';
  }

  return null; // Let AI handle
}

// ── Message Processing ─────────────────────────────────────
async function processMessage(phone, text, chatType) {
  try {
    // Initialize session if needed
    if (!sessions.has(phone)) {
      sessions.set(phone, {
        history: [],
        name: null,
        aesthetic_goal: null,
        phase: 'START',
        reengagement_timer: null
      });
    }

    const session = sessions.get(phone);

    // Add user message to history
    session.history.push({ role: 'user', content: text });
    if (session.history.length > MAX_HISTORY) {
      session.history.shift();
    }

    console.log(`📩 [${phone}]: ${text.substring(0, 60)}...`);

    // Classification logic
    const classification = classifyMessage(phone, text, chatType);

    if (classification.action === 'IGNORE') {
      console.log(`🚫 Ignoring group message from ${phone}`);
      return;
    }

    if (classification.action === 'SUPPLIER') {
      await upsertPatient({ phone, status: 'SUPPLIER' });
      const supplierResponse = 'Gracias por contactarnos. Este canal es exclusivamente para pacientes. Para asuntos administrativos, por favor contacta al consultorio por email.';
      await enviarMensaje(phone, supplierResponse);
      console.log(`🏢 Supplier response sent to ${phone}`);
      return;
    }

    // Handle conversion flow for new leads
    if (classification.action === 'NEW_LEAD') {
      const conversionResponse = handleConversionFlow(phone, session, text);
      if (conversionResponse) {
        session.history.push({ role: 'assistant', content: conversionResponse });
        await enviarMensaje(phone, conversionResponse);
        extractIntent(phone, conversionResponse, session);
        return;
      }
    }

    // Build appropriate system prompt
    let systemPrompt;
    if (classification.action === 'CURRENT_PATIENT') {
      systemPrompt = buildCurrentPatientPrompt();
    } else {
      systemPrompt = buildSystemPrompt(session);
    }

    // Call Claude
    const response = await ai.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: session.history,
    });

    const aiResponse = response.content[0].text;

    // Add AI response to history
    session.history.push({ role: 'assistant', content: aiResponse });

    // Extract intent and update CRM
    const intent = extractIntent(phone, aiResponse, session);

    // Update session data from intent
    if (intent.name && !session.name) session.name = intent.name;
    if (intent.aesthetic_goal && !session.aesthetic_goal) session.aesthetic_goal = intent.aesthetic_goal;

    // Cancel reengagement timer if user responded
    if (session.reengagement_timer) {
      clearTimeout(session.reengagement_timer);
      session.reengagement_timer = null;
    }

    console.log(`✉️ Valeria → [${phone}]: ${aiResponse.substring(0, 60)}...`);

    // Send response
    await enviarMensaje(phone, aiResponse);

  } catch (error) {
    console.error('❌ Error processing message:', error?.message || error);
  }
}

// ── WhatsApp Message Sending ──────────────────────────────
async function enviarMensaje(para, texto) {
  const url = `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: para,
      type: 'text',
      text: {
        preview_url: false,
        body: texto,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Error sending WA:', JSON.stringify(error, null, 2));
  }
}

// ── ENDPOINTS ─────────────────────────────────────────────

// Health Check
app.get('/', (req, res) => {
  res.json({
    status: '🦷 Valeria activa',
    servicio: 'Dra. Yuri Quintero — Odontología Estética · Neiva',
    hora: new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
  });
});

// Webhook Verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verified by Meta');
    res.status(200).send(challenge);
  } else {
    console.warn('⚠️ Invalid token in verification:', token);
    res.sendStatus(403);
  }
});

// Receive WhatsApp Messages
app.post('/webhook', async (req, res) => {
  // Respond to Meta immediately (< 5 seconds)
  res.sendStatus(200);

  try {
    const body = req.body;
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages) return;

    const mensaje = value.messages[0];

    // Only process text messages
    if (mensaje.type !== 'text') {
      const numero = mensaje.from;
      await enviarMensaje(numero, 'Por el momento solo puedo responder mensajes de texto 😊 ¿En qué te puedo ayudar?');
      return;
    }

    const numeroWA = mensaje.from;
    const texto = mensaje.text.body.trim();
    const chatType = value.contacts?.[0]?.profile?.name ? 'individual' : 'group';

    // Process message asynchronously
    processMessage(numeroWA, texto, chatType);

  } catch (error) {
    console.error('❌ Error in webhook:', error?.message || error);
  }
});

// Leads Endpoint (for debugging)
app.get('/leads', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Patients!A:G',
    });

    const rows = response.data.values || [];
    const patients = rows.slice(1).map(row => ({
      phone: row[0],
      name: row[1] || null,
      status: row[2] || 'NEW',
      aesthetic_goal: row[3] || null,
      first_contact_date: row[4] || null,
      last_interaction_date: row[5] || null,
      notes: row[6] || null,
    }));

    res.json({ patients });
  } catch (error) {
    console.error('❌ Error fetching leads:', error.message);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// ── SERVER START ──────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🦷 Valeria listening on port ${PORT}`);
  console.log(`👩‍⚕️ Dra. Yuri Quintero — Odontología Estética · Neiva, Huila`);
  console.log(`🕐 ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}\n`);
});
