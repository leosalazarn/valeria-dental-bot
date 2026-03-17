// Session module — in-memory session store with memory optimization
import {MAX_HISTORY, SESSION_EXPIRY_HOURS, CLEANUP_INTERVAL_MINUTES} from './config.js';
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
            // ── Conversion metrics
            metrics: {
                first_contact: new Date().toISOString(),  // when session was created
                first_response_ms: null,                  // ms until Valeria's first reply
                reengagement_sent: false,                 // did the 30-min timer fire?
                reengagement_recovered: false,            // did patient reply after reengagement?
                phase_timestamps: {
                    START:        new Date().toISOString(),
                    EXTRACTION:   null,
                    HOOK:         null,
                    DATA_CAPTURE: null,
                    PAYMENT:      null,
                    CLOSING:      null,
                },
            },
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
    session.history.push({role, content});

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

// Record when a phase transition happens
export function recordPhase(phone, phase) {
    const session = sessions.get(phone);
    if (session?.metrics?.phase_timestamps) {
        session.metrics.phase_timestamps[phase] = new Date().toISOString();
    }
}

// Record ms from first contact to first Valeria response
export function recordFirstResponse(phone) {
    const session = sessions.get(phone);
    if (session?.metrics && session.metrics.first_response_ms === null) {
        const start = new Date(session.metrics.first_contact).getTime();
        session.metrics.first_response_ms = Date.now() - start;
    }
}

// Return all active sessions (for metrics endpoint)
export function getAllSessions() {
    return Array.from(sessions.entries()).map(([phone, session]) => ({
        phone,
        phase: session.phase,
        source: session.source,
        name: session.name,
        aesthetic_goal: session.aesthetic_goal,
        data_complete: session.data_complete,
        last_interaction: session.last_interaction,
        metrics: session.metrics,
    }));
}