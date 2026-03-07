// Conversion flow module — orchestrates message processing pipeline
import { getSession, addMessageToHistory, updateSession, setReengagementTimer, clearReengagementTimer } from './session.js';
import { upsertPatient } from './crm.js';
import { buildSystemPrompt, buildCurrentPatientPrompt } from './prompt.js';
import { classifyMessage } from './classifier.js';
import { callValeria } from './ai.js';
import { sendMessage } from './whatsapp.js';
import { extractIntent } from './intent.js';
import { REENGAGEMENT_DELAY_MINUTES } from './config.js';
import log from './utils/logger.js';

export async function processMessage(phone, text, chatType) {
  try {
    // Get or initialize session
    const session = getSession(phone);

    // Add user message to history
    addMessageToHistory(phone, 'user', text);

    log.incoming(phone, text);

    // Classification
    const classification = classifyMessage(phone, text, chatType);

    if (classification.action === 'IGNORE') {
      log.groupIgnored(phone);
      return;
    }

    if (classification.action === 'SUPPLIER') {
      upsertPatient({ phone, status: 'SUPPLIER', source: classification.source, trigger_message: classification.trigger_message });
      log.supplierIgnored(phone);
      return;
    }

    // Set session source from classification
    updateSession(phone, { source: classification.source });

    // Handle conversion flow for new leads
    if (classification.action === 'WARM_LEAD' || classification.action === 'ORGANIC_LEAD') {
      const conversionResponse = handleConversionFlow(phone, session);
      if (conversionResponse) {
        addMessageToHistory(phone, 'assistant', conversionResponse);
        await sendMessage(phone, conversionResponse);
        extractIntent(phone, conversionResponse, session, classification);
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
    const aiResponse = await callValeria(session.history, systemPrompt);

    // Add AI response to history
    addMessageToHistory(phone, 'assistant', aiResponse);

    // Extract intent and update CRM
    const intent = extractIntent(phone, aiResponse, session, classification);

    // Update session data from intent
    updateSession(phone, {
      name: intent.name || session.name,
      aesthetic_goal: intent.aesthetic_goal || session.aesthetic_goal,
      full_name: intent.full_name || session.full_name,
      email: intent.email || session.email,
      consultation_reason: intent.consultation_reason || session.consultation_reason,
      data_complete: intent.data_complete || session.data_complete,
    });

    // Cancel reengagement timer if user responded
    clearReengagementTimer(phone);

    log.outgoing(phone, aiResponse);

    // Send response
    await sendMessage(phone, aiResponse);

  } catch (error) {
    log.error('processMessage', error);
  }
}

// Conversion flow phases
function handleConversionFlow(phone, session) {
  const phase = session.phase || 'START';

  // Phase A: Data extraction
  if (!session.name || !session.aesthetic_goal) {
    updateSession(phone, { phase: 'EXTRACTION' });
    return null; // Let AI handle natural extraction
  }

  // Phase B: Hook delivery
  if (phase === 'EXTRACTION' && session.name && session.aesthetic_goal) {
    updateSession(phone, { phase: 'HOOK' });

    // Start reengagement timer
    setReengagementTimer(phone, () => {
      const reengagementMessage = `He estado pensando en tu caso, ${session.name} 😊 ¿Te gustaría ver fotos de resultados similares al tuyo antes de agendar? Muchos pacientes se deciden una vez que ven los antes y después.`;
      sendMessage(phone, reengagementMessage);
      log.reengagement(phone);
    }, REENGAGEMENT_DELAY_MINUTES * 60 * 1000);

    return `Entiendo, ${session.name}. Muchos de nuestros pacientes estaban buscando exactamente eso y lo lograron con nuestro protocolo. Para asegurarme de que seas la candidata ideal, la Dra. Yuri necesita verte para una consulta de 15 minutos — y lo mejor es que los $80.000 se acreditan completamente a tu tratamiento.
¿Te gustaría agendar esta semana?`;
  }

  // Phase C: Data capture
  if (phase === 'HOOK') {
    updateSession(phone, { phase: 'DATA_CAPTURE' });
    return `¡Perfecto! Para apartar su cita con la Dra. Yuri necesito estos datos:

- Nombre completo
- Correo electrónico  
- Motivo de la consulta

¿Me los regala? 😊`;
  }

  // Phase D: Closing
  if (phase === 'DATA_CAPTURE') {
    updateSession(phone, { phase: 'CLOSING' });
  }

  return null; // Let AI handle
}
