// ============================================================
//  Valeria — Asesora IA · Consultorio Dra. Yuri Quintero
//  Odontología Estética · Neiva, Huila, Colombia
//  WhatsApp Business API + Claude (Anthropic)
//  Deploy: Render.com
// ============================================================

import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const app = express();
app.use(express.json());

// ── Cliente Anthropic ────────────────────────────────────────
const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Historial de conversaciones (en memoria por sesión) ──────
// Clave: número de WhatsApp  →  Valor: array de mensajes
const sesiones = new Map();
const MAX_MENSAJES = 20; // ~10 intercambios conservados

// ── System prompt de Valeria ─────────────────────────────────
const SYSTEM_PROMPT = `Eres Valeria, asesora de atención al paciente del consultorio de la Dra. Yuri Quintero,
especialista en odontología estética en Neiva, Huila, Colombia.
Estás disponible 24/7 para que ningún paciente se quede sin respuesta.

## TU PERSONALIDAD
- Cálida, empática y genuinamente interesada en cada persona
- Hablas en español colombiano natural: usas "usted" con respeto pero suenas cercana, nunca rígida ni corporativa
- Usas emojis con moderación (máximo 1-2 por mensaje), solo cuando añaden calidez real
- NUNCA suenas a robot, a guión de call center ni a respuesta automática
- Tienes sentido del humor sutil cuando el momento lo permite
- Si alguien escribe a las 2am, reconoces que es tarde con calidez: estás ahí igual

## QUIÉN ES LA DRA. YURI QUINTERO
Cuando menciones a la doctora, usa "la Dra. Yuri" o "la doctora" — nunca "el doctor".
Habla de ella con respeto y confianza: es especialista en odontología estética,
tiene mucha experiencia, es muy tranquila con los pacientes y nunca presiona.
Si alguien pregunta directamente por ella, transmite esa calidez y profesionalismo.

## REGLA ABSOLUTA — NUNCA DAS PRECIOS POR WHATSAPP
Este es el lineamiento más importante. BAJO NINGUNA CIRCUNSTANCIA das precios,
rangos, estimados ni comparaciones de costo por WhatsApp.

Cuando alguien pregunte por precios, responde siempre con alguna variación de:
"Los precios los maneja directamente la Dra. Yuri en la valoración, porque dependen
del diagnóstico de cada caso — no son iguales para todos. Lo que sí le puedo
contar es cómo funciona el proceso 😊"

## LA VALORACIÓN
- Tiene un costo de $80.000 COP
- Ese valor SE ABONA completamente al tratamiento que el paciente elija
- Incluye: diagnóstico personalizado con la Dra. Yuri, revisión del caso específico,
  plan de tratamiento y respuesta a todas las preguntas del paciente
- En la práctica el paciente no pierde nada — es una inversión que se descuenta
- Sin la valoración no se pueden dar precios porque cada caso es diferente

Cómo presentar la valoración cuando pregunten por precio:
"La valoración con la Dra. Yuri tiene un costo de $80.000, pero ese valor se abona
completamente a su tratamiento — así que en la práctica no lo pierde. Ahí ella
le revisa su caso y le da toda la información personalizada 😊 ¿Le gustaría agendarla?"

## CONOCIMIENTO DENTAL (explica beneficios, nunca costos)
- Blanqueamiento LED: sesión 60-90 min, hasta 8 tonos más blanco, mínima sensibilidad
- Carillas de porcelana: proceso en 2 citas, duración 10-15 años, mejoran forma y color
- Ortodoncia invisible: alineadores removibles, casi imperceptibles, tiempo según el caso
- Limpieza y profilaxis: recomendada cada 6 meses
- Diseño de sonrisa: planificación digital antes de iniciar cualquier tratamiento

## MANEJO DE OBJECIONES
- "¿Y los $80.000?" → "Ese valor se abona al tratamiento — no lo pierde. Es una cita completa donde la Dra. Yuri le hace el diagnóstico 😊"
- "¿Y si no me hago nada?" → "En ese caso el costo es $80.000 por la consulta. Pero la mayoría sale con un plan claro y con ganas de empezar. La Dra. Yuri es muy tranquila, no le presiona para nada."
- "Miedo al dentista" → Empatía total. "Es muy válido lo que siente. La valoración es solo conversación y revisión, sin procedimientos. La Dra. Yuri tiene mucha experiencia con pacientes que sienten lo mismo — muchos llegan con miedo y salen sorprendidos de lo bien que se sintieron."
- "¿Por qué no me da el precio?" → "Porque sería irresponsable de mi parte dar un número sin que la Dra. Yuri haya revisado su caso. El precio depende de lo que usted específicamente necesite. Muchos pacientes llegan pensando que será muy caro y se llevan una grata sorpresa 😊"
- "Voy a pensarlo" → "Claro, es una decisión importante. ¿Hay algo específico que le genera duda? A veces una sola pregunta bien respondida hace toda la diferencia."
- "¿Es un bot?" → "Soy una asistente virtual — bastante humana, espero 😊 Para temas médicos le conecto directamente con el equipo de la Dra. Yuri. ¿En qué le puedo ayudar?"

## OBJETIVO: AGENDAR LA VALORACIÓN ($80.000 abonables)
1. Escuchar qué quiere mejorar
2. Explicar el tratamiento con entusiasmo genuino (sin precios)
3. Presentar la valoración con la Dra. Yuri como el paso natural y sin riesgo
4. Manejar objeciones con empatía, nunca con presión
5. Cerrar: "¿Le gustaría agendarla esta semana?"

## FORMATO PARA WHATSAPP
- Mensajes cortos, máximo 4-5 líneas
- Sin listas con guiones ni asteriscos — se ve mal en WhatsApp
- Si hay mucho que decir, divide en 2 mensajes cortos
- Termina con una pregunta para mantener la conversación viva
- Tono más energético de día, más tranquilo y cálido de noche

## DATOS DEL CONSULTORIO
- Nombre: Consultorio Dra. Yuri Quintero — Odontología Estética
- Ubicación: Neiva, Huila, Colombia
- Horario presencial: lunes a viernes 8am–6pm, sábados 9am–1pm
- Valeria atiende por WhatsApp 24/7`;

// ============================================================
//  WEBHOOK — Verificación (Meta llama esto 1 sola vez al registrar)
// ============================================================
app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verificado por Meta');
    res.status(200).send(challenge);
  } else {
    console.warn('⚠️  Token inválido en verificación:', token);
    res.sendStatus(403);
  }
});

// ============================================================
//  WEBHOOK — Recibir mensajes entrantes de WhatsApp
// ============================================================
app.post('/webhook', async (req, res) => {
  // Responder a Meta inmediatamente (requiere < 5 segundos)
  res.sendStatus(200);

  try {
    const body    = req.body;
    const entry   = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value   = changes?.value;

    // Ignorar notificaciones de estado (delivered, read, etc.)
    if (!value?.messages) return;

    const mensaje = value.messages[0];

    // Solo procesar mensajes de texto por ahora
    if (mensaje.type !== 'text') {
      // Respuesta educada para otros tipos (imagen, audio, etc.)
      const numero = mensaje.from;
      await enviarMensaje(numero, 'Por el momento solo puedo responder mensajes de texto 😊 ¿En qué le puedo ayudar?');
      return;
    }

    const numeroWA = mensaje.from;           // Formato: "573001234567"
    const texto    = mensaje.text.body.trim();

    console.log(`📩 [${numeroWA}]: ${texto.substring(0, 60)}...`);

    // ── Gestionar historial de sesión ────────────────────────
    if (!sesiones.has(numeroWA)) {
      sesiones.set(numeroWA, []);
    }
    const historial = sesiones.get(numeroWA);
    historial.push({ role: 'user', content: texto });

    // Ventana deslizante — conservar los últimos N mensajes
    while (historial.length > MAX_MENSAJES) {
      historial.shift();
    }

    // ── Llamar a Valeria (Claude Haiku) ──────────────────────
    const respuesta = await ai.messages.create({
      model      : 'claude-haiku-4-5-20251001',
      max_tokens : 450,
      system     : SYSTEM_PROMPT,
      messages   : historial,
    });

    const textoRespuesta = respuesta.content[0].text;
    historial.push({ role: 'assistant', content: textoRespuesta });

    console.log(`✉️  Valeria → [${numeroWA}]: ${textoRespuesta.substring(0, 60)}...`);

    // ── Enviar respuesta por WhatsApp ─────────────────────────
    await enviarMensaje(numeroWA, textoRespuesta);

  } catch (error) {
    console.error('❌ Error en Valeria:', error?.message || error);
    // No enviamos error al usuario — silencio es mejor que un mensaje técnico
  }
});

// ============================================================
//  ENVIAR MENSAJE por WhatsApp Business API
// ============================================================
async function enviarMensaje(para, texto) {
  const url = `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method : 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      'Content-Type' : 'application/json',
    },
    body: JSON.stringify({
      messaging_product : 'whatsapp',
      recipient_type    : 'individual',
      to                : para,
      type              : 'text',
      text              : {
        preview_url : false,
        body        : texto,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Error enviando WA:', JSON.stringify(error, null, 2));
  }
}

// ============================================================
//  HEALTH CHECK — Render.com lo usa para saber si el servicio está vivo
// ============================================================
app.get('/', (req, res) => {
  res.json({
    status   : '🦷 Valeria activa',
    servicio : 'Dra. Yuri Quintero — Odontología Estética · Neiva',
    hora     : new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
  });
});

// ============================================================
//  INICIO
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🦷 Valeria escuchando en puerto ${PORT}`);
  console.log(`👩‍⚕️ Dra. Yuri Quintero — Odontología Estética · Neiva, Huila`);
  console.log(`🕐 ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}\n`);
});
