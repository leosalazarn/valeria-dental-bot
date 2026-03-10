// Conversion flow module — orchestrates message processing pipeline (shorter messages)
import {
    getSession,
    addMessageToHistory,
    updateSession,
    setReengagementTimer,
    clearReengagementTimer
} from './session.js';
import {upsertPatient} from './crm.js';
import {buildSystemPrompt, buildCurrentPatientPrompt} from './prompt.js';
import {classifyMessage} from './classifier.js';
import {callValeria} from './ai.js';
import {sendMessage} from './whatsapp.js';
import {extractIntent} from './intent.js';
import {REENGAGEMENT_DELAY_MINUTES, CONSULTATION_PRICE, CONSULTATION_DURATION_MINUTES} from './config.js';
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

        log.incoming(phone, text);

        // Classification
        const classification = classifyMessage(phone, text, chatType);

        if (classification.action === 'IGNORE') {
            log.groupIgnored(phone);
            return;
        }

        if (classification.action === 'SUPPLIER') {
            upsertPatient({
                phone,
                status: 'SUPPLIER',
                source: classification.source,
                trigger_message: classification.trigger_message
            });
            log.supplierIgnored(phone);
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
        return null;
    }

    // Phase B: Hook delivery — fires once when name + goal are available
    if (phase === 'EXTRACTION') {
        updateSession(phone, {phase: 'HOOK'});

        // Start reengagement timer
        setReengagementTimer(phone, () => {
            sendMessage(phone, `${session.name}, ¿le gustaría ver resultados similares al suyo antes de agendar? 😊`);
            log.reengagement(phone);
        }, REENGAGEMENT_DELAY_MINUTES * 60 * 1000);

        return `¡Qué bueno, ${session.name}! La Dra. Yuri te puede ayudar con eso 😊
¿Te gustaría una valoración de ${CONSULTATION_DURATION_MINUTES} min? Los $${CONSULTATION_PRICE.toLocaleString('es-CO')} se abonan al tratamiento.`;
    }

    // Phase C: Data capture — only triggers when patient responds positively to the hook
    if (phase === 'HOOK' && isPositive) {
        updateSession(phone, {phase: 'DATA_CAPTURE'});
        clearReengagementTimer(phone);
        const motivoPrefill = session.aesthetic_goal ? `\n(Motivo de consulta ya lo tenemos: ${session.aesthetic_goal} ✅ — solo confirma si es correcto)` : '\n• Motivo de consulta';
        return `¡Perfecto! Solo necesito un par de datos para reservar tu cita con la Dra. Yuri 😊

• Nombre completo
• Correo electrónico${motivoPrefill}`;
    }

    // Phase D: Payment — send payment info after data is captured
    if (phase === 'DATA_CAPTURE') {
        updateSession(phone, {phase: 'PAYMENT'});
        return null; // AI handles data extraction first
    }

    // Phase E: Closing — after payment instructions sent
    if (phase === 'PAYMENT') {
        updateSession(phone, {phase: 'CLOSING'});
        return null;
    }

    return null; // Let AI handle all other cases
}