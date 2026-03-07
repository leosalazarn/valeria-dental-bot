// Session module — in-memory session store with memory optimization
import { MAX_HISTORY, SESSION_EXPIRY_HOURS, CLEANUP_INTERVAL_MINUTES } from './config.js';
import log from './utils/logger.js';

const sessions = new Map();

// Auto-cleanup sessions older than SESSION_EXPIRY_HOURS
setInterval(() => {
  const now = new Date();
  const expiryMs = SESSION_EXPIRY_HOURS * 60 * 60 * 1000;

  for (const [phone, session] of sessions.entries()) {
    const lastInteraction = new Date(session.last_interaction);
    if (now - lastInteraction > expiryMs) {
      if (session.reengagement_timer) clearTimeout(session.reengagement_timer);
      sessions.delete(phone);
      log.info(`Session expired and purged: ${phone}`);
    }
  }
}, CLEANUP_INTERVAL_MINUTES * 60 * 1000);

export function getSession(phone) {
  if (!sessions.has(phone)) {
    sessions.set(phone, {
      history: [],
      name: null,
      aesthetic_goal: null,
      phase: 'START',
      source: 'ORGANIC',
      reengagement_timer: null,
      last_interaction: new Date().toISOString(),
      full_name: null,
      email: null,
      consultation_reason: null,
      data_complete: false,
    });
  }
  const session = sessions.get(phone);
  session.last_interaction = new Date().toISOString();
  return session;
}

export function updateSession(phone, data) {
  const session = getSession(phone);
  Object.assign(session, data);
  session.last_interaction = new Date().toISOString();
}

export function addMessageToHistory(phone, role, content) {
  const session = getSession(phone);
  session.history.push({ role, content });

  // Enforce sliding window: keep only MAX_HISTORY messages
  if (session.history.length > MAX_HISTORY) {
    session.history.shift();
  }
}

export function clearReengagementTimer(phone) {
  const session = sessions.get(phone);
  if (session && session.reengagement_timer) {
    clearTimeout(session.reengagement_timer);
    session.reengagement_timer = null;
  }
}

export function setReengagementTimer(phone, callback, delayMs) {
  clearReengagementTimer(phone);
  const session = sessions.get(phone);
  if (session) {
    session.reengagement_timer = setTimeout(callback, delayMs);
  }
}
