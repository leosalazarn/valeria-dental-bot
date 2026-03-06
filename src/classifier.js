// Classifier module — pre-processing message classification rules
import { TRIGGERS, SUPPLIER_KEYWORDS } from './config.js';
import { findPatient } from './crm.js';
import log from './utils/logger.js';

export function classifyMessage(phone, text, chatType) {
  // RULE 1: Ignore group messages
  if (chatType === 'group') {
    return { action: 'IGNORE', reason: 'group_message' };
  }

  // RULE 2: Supplier detection
  if (SUPPLIER_KEYWORDS.some(keyword => text.toLowerCase().includes(keyword))) {
    return { action: 'SUPPLIER', reason: 'supplier_keywords' };
  }

  // RULE 3: Returning patient in active treatment
  const patient = findPatient(phone);
  if (patient && patient.status === 'IN_TREATMENT') {
    return { action: 'CURRENT_PATIENT', reason: 'in_treatment' };
  }

  // RULE 4: Trigger detection (warm lead from ad)
  const isTrigger = TRIGGERS.some(trigger => text.toLowerCase().includes(trigger.toLowerCase()));
  const triggerMessage = isTrigger ? TRIGGERS.find(trigger => text.toLowerCase().includes(trigger.toLowerCase())) : null;

  if (isTrigger) {
    log.trigger(phone, triggerMessage);
    return { action: 'WARM_LEAD', reason: 'ad_trigger', source: 'AD_TRIGGER', trigger_message: triggerMessage };
  }

  // RULE 5: Organic or returning lead
  return { action: 'ORGANIC_LEAD', reason: 'organic_flow', source: 'ORGANIC', trigger_message: null };
}

