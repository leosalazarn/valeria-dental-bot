// Intent extraction module — analyze conversation intent
import { upsertPatient } from './crm.js';
import log from './utils/logger.js';
import { formatColombiaTime } from './utils/time.js';

export function extractIntent(phone, response, session, classification = {}) {
  const intent = {
    phone,
    name: session.name,
    aesthetic_goal: session.aesthetic_goal,
    source: session.source || classification.source || 'ORGANIC',
    trigger_message: classification.trigger_message || null,
    intent: 'OTHER',
    phase: session.phase || 'START',
    requires_human: false,
    timestamp: formatColombiaTime(),
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

  log.lead(intent);

  // Update patient in CRM
  upsertPatient({
    phone,
    name: session.name,
    status: session.phase === 'CLOSING' ? 'CONSULTATION_SCHEDULED' : 'PROSPECT',
    aesthetic_goal: session.aesthetic_goal,
    source: intent.source,
    trigger_message: intent.trigger_message,
    last_intent: intent.intent,
    notes: `Intent: ${intent.intent} | Phase: ${intent.phase}`,
  });

  return intent;
}

