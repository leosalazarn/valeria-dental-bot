// Conversion flow module — orchestrates message processing pipeline (shorter messages)
import {
    getSession,
    addMessageToHistory,
    updateSession,
    setReengagementTimer,
    clearReengagementTimer,
    recordPhase,
    recordFirstResponse,
} from './session.js';
import {buildSystemPrompt, buildCurrentPatientPrompt} from './prompt.js';
import {classifyMessage} from './classifier.js';
import {callValeria} from './ai.js';
import {sendMessage} from './whatsapp.js';
import {extractIntent} from './intent.js';
import {
    REENGAGEMENT_DELAY_MINUTES,
    MSG_REENGAGEMENT_HOOK,
    MSG_REENGAGEMENT_EXTRACTION,
    MSG_REENGAGEMENT_DATA_CAPTURE,
    MSG_HOOK, MSG_DATA_CAPTURE
} from './config.js';
import log from './utils/logger.js';

export const POSITIVE_RESPONSES = [
    'listo', 'sí', 'si', 'me convenciste', 'quiero agendar',
    'dale', 'claro', 'ok', 'okay', 'perfecto', 'bueno',
    'me interesa', 'quiero', 'vamos', 'agendemos', 'agendar',
    'de acuerdo', 'está bien', 'acepto', 'me animo', 'cuándo',
    'cuando', 'cómo agendo', 'como agendo'
];

// Strip internal signals before sending to patient
export function stripSignals(text) {
    return text
        .replace(/\nNAME:.*$/gm, '')
        .replace(/\nGOAL:.*$/gm, '')
        .replace(/\nEXTRACTED:.*$/gm, '')
        .trim();
}

export async function processMessage(phone, text, chatType) {
    try {
        // Get or initialize session
        const session = getSession(phone);

        // Add user message to history
        addMessageToHistory(phone, 'user', text);
        updateSession(phone, {message_count: (session.message_count || 0) + 1});

        log.incoming(phone, text);

        // Classification
        const classification = classifyMessage(phone, text, chatType);

        if (classification.action === 'IGNORE') {
            log.groupIgnored(phone);
            return;
        }

        // Set session source from classification
        updateSession(phone, {source: classification.source});

        // Handle conversion flow for new leads — pass text for intent detection
        if (classification.action === 'WARM_LEAD' || classification.action === 'ORGANIC_LEAD') {
            const conversionResponse = handleConversionFlow(phone, session, text);
            if (conversionResponse) {
                addMessageToHistory(phone, 'assistant', conversionResponse);
                await sendMessage(phone, conversionResponse);
                recordFirstResponse(phone);
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

        // Strip internal signals before sending to patient
        const cleanResponse = stripSignals(aiResponse);

        clearReengagementTimer(phone);
        recordFirstResponse(phone);
        log.outgoing(phone, cleanResponse);
        await sendMessage(phone, cleanResponse);

    } catch (error) {
        log.error('processMessage', error);
    }
}

// Conversion flow phases
function handleConversionFlow(phone, session, text = '') {
    const phase = session.phase || 'START';
    const textLower = text.toLowerCase();
    const isPositive = POSITIVE_RESPONSES.some(word => textLower.includes(word));

    // Phase A: Data extraction — AI handles naturally until name + goal are known
    if (!session.name || !session.aesthetic_goal) {
        updateSession(phone, {phase: 'EXTRACTION'});
        recordPhase(phone, 'EXTRACTION');
        // Reengagement if patient goes silent during extraction
        setReengagementTimer(phone, () => {
            const s = getSession(phone);
            if (s?.metrics) s.metrics.reengagement_sent = true;
            const name = s?.name || 'Hola';
            sendMessage(phone, MSG_REENGAGEMENT_EXTRACTION(name));
            log.reengagement(phone);
        }, REENGAGEMENT_DELAY_MINUTES * 60 * 1000);
        return null;
    }

    // Phase B: Hook delivery — requires min 3 exchanges to avoid premature pitch
    const MIN_EXCHANGES_FOR_HOOK = 3;
    if (phase === 'EXTRACTION' && (session.message_count || 0) >= MIN_EXCHANGES_FOR_HOOK) {
        updateSession(phone, {phase: 'HOOK'});
        recordPhase(phone, 'HOOK');

        setReengagementTimer(phone, () => {
            const s = getSession(phone);
            if (s?.metrics) s.metrics.reengagement_sent = true;
            sendMessage(phone, MSG_REENGAGEMENT_HOOK(session.name));
            log.reengagement(phone);
        }, REENGAGEMENT_DELAY_MINUTES * 60 * 1000);

        return MSG_HOOK(session.name);
    }

    // Still in EXTRACTION but not enough exchanges yet — let AI keep talking
    if (phase === 'EXTRACTION') {
        return null;
    }

    // Phase C: Data capture — only triggers when patient responds positively to the hook
    if (phase === 'HOOK' && isPositive) {
        updateSession(phone, {phase: 'DATA_CAPTURE'});
        recordPhase(phone, 'DATA_CAPTURE');
        clearReengagementTimer(phone);
        const s = getSession(phone);
        if (s?.metrics?.reengagement_sent) s.metrics.reengagement_recovered = true;
        // Reengagement if patient goes silent after receiving data capture form
        setReengagementTimer(phone, () => {
            const s2 = getSession(phone);
            if (s2?.metrics) s2.metrics.reengagement_sent = true;
            sendMessage(phone, MSG_REENGAGEMENT_DATA_CAPTURE(session.name));
            log.reengagement(phone);
        }, REENGAGEMENT_DELAY_MINUTES * 60 * 1000);
        return MSG_DATA_CAPTURE(session.aesthetic_goal);
    }

    // Phase D: Payment — only advance when data is fully captured (data_complete = true)
    if (phase === 'DATA_CAPTURE') {
        if (session.data_complete) {
            updateSession(phone, {phase: 'PAYMENT'});
            recordPhase(phone, 'PAYMENT');
        }
        return null; // AI handles data extraction and confirmation
    }

    // Phase E: Closing — AI handles PAYMENT phase entirely; only advance after payment info was sent
    if (phase === 'PAYMENT') {
        if (!session.payment_info_sent) {
            // First time in PAYMENT — mark it and let AI send the block
            updateSession(phone, {payment_info_sent: true});
            return null;
        }
        // Subsequent messages in PAYMENT → move to CLOSING
        updateSession(phone, {phase: 'CLOSING'});
        recordPhase(phone, 'CLOSING');
        return null;
    }

    return null; // Let AI handle all other cases
}