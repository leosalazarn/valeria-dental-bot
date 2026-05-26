import { BANCOLOMBIA_ACCOUNT, NEQUI_NUMBER, DAVIVIENDA_ACCOUNT, BANK_HOLDER_CC } from '../config.js';
import log from '../utils/logger.js';

const BANK_DATA_PATTERNS = [
    BANCOLOMBIA_ACCOUNT,
    NEQUI_NUMBER,
    DAVIVIENDA_ACCOUNT,
    BANK_HOLDER_CC,
].filter(Boolean);

export function containsBankDataLeak(responseText, sessionPhase) {
    if (sessionPhase === 'PAYMENT') return false;
    return BANK_DATA_PATTERNS.some(pattern => responseText.includes(pattern));
}

export function auditOutput(responseText, sessionPhase) {
    if (containsBankDataLeak(responseText, sessionPhase)) {
        log.warn('OUTPUT_GUARDRAIL', `Bank data detected outside PAYMENT phase (phase: ${sessionPhase})`);
        return {
            safe: false,
            reason: 'bank_data_leak',
            text: 'En este momento no puedo procesar esa información. Nuestro equipo te contactará pronto 🙌',
        };
    }
    return { safe: true, reason: null, text: responseText };
}
