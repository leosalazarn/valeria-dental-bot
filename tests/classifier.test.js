import { describe, it, expect } from 'vitest';
import { classifyMessage } from '../src/classifier.js';
import { upsertPatient } from '../src/crm.js';
import { updateSession } from '../src/session.js';

const phone = (n) => `+5732000${n}`;

describe('classifier — Rule 1: group messages', () => {
    it('returns IGNORE for any group message', () => {
        const result = classifyMessage(phone('c-01'), 'Quiero mejorar mi sonrisa', 'group');
        expect(result.action).toBe('IGNORE');
        expect(result.reason).toBe('group_message');
    });

    it('ignores even trigger messages if sent from a group', () => {
        const result = classifyMessage(phone('c-02'), 'Quiero agendar', 'group');
        expect(result.action).toBe('IGNORE');
    });
});

describe('classifier — Rule 2: supplier detection', () => {
    it('detects English supplier keyword "invoice"', () => {
        const result = classifyMessage(phone('c-03'), 'Please send the invoice for the order', 'individual');
        expect(result.action).toBe('SUPPLIER');
    });

    it('detects Spanish supplier keyword "factura"', () => {
        const result = classifyMessage(phone('c-04'), 'Le envío la factura del pedido', 'individual');
        expect(result.action).toBe('SUPPLIER');
    });

    it('detects "cotización" keyword', () => {
        const result = classifyMessage(phone('c-05'), 'Aquí va la cotización de insumos', 'individual');
        expect(result.action).toBe('SUPPLIER');
    });

    it('detection is case-insensitive', () => {
        const result = classifyMessage(phone('c-06'), 'INVOICE ATTACHED', 'individual');
        expect(result.action).toBe('SUPPLIER');
    });
});

describe('classifier — Rule 3: in-treatment patient', () => {
    it('returns CURRENT_PATIENT for a phone with status IN_TREATMENT', () => {
        const p = phone('c-07');
        upsertPatient({ phone: p, status: 'IN_TREATMENT' });
        const result = classifyMessage(p, 'Tengo una duda', 'individual');
        expect(result.action).toBe('CURRENT_PATIENT');
        expect(result.reason).toBe('in_treatment');
    });

    it('does NOT return CURRENT_PATIENT for PROSPECT status', () => {
        const p = phone('c-08');
        upsertPatient({ phone: p, status: 'PROSPECT' });
        // This patient has no active session and no trigger → should be IGNORE
        const result = classifyMessage(p, 'Una pregunta', 'individual');
        expect(result.action).not.toBe('CURRENT_PATIENT');
    });
});

describe('classifier — Rule 4: trigger detection (warm lead)', () => {
    it('detects exact trigger message', () => {
        const result = classifyMessage(phone('c-09'), 'Quiero mejorar mi sonrisa', 'individual');
        expect(result.action).toBe('WARM_LEAD');
        expect(result.source).toBe('AD_TRIGGER');
        expect(result.trigger_message).toBeTruthy();
    });

    it('detects trigger embedded in longer message', () => {
        const result = classifyMessage(phone('c-10'), 'Hola! Quiero más información.', 'individual');
        expect(result.action).toBe('WARM_LEAD');
    });

    it('detection is case-insensitive', () => {
        const result = classifyMessage(phone('c-11'), 'QUIERO AGENDAR', 'individual');
        expect(result.action).toBe('WARM_LEAD');
    });

    it('includes trigger_message in result', () => {
        const result = classifyMessage(phone('c-12'), 'Precio?', 'individual');
        expect(result.trigger_message).toBe('Precio?');
    });
});

describe('classifier — Rule 5: active session (organic lead)', () => {
    it('returns ORGANIC_LEAD when session phase is not START', () => {
        const p = phone('c-13');
        updateSession(p, { phase: 'EXTRACTION' });
        const result = classifyMessage(p, 'Quiero hacerme los dientes', 'individual');
        expect(result.action).toBe('ORGANIC_LEAD');
        expect(result.source).toBe('ORGANIC');
    });

    it('does NOT return ORGANIC_LEAD when phase is START', () => {
        const p = phone('c-14');
        updateSession(p, { phase: 'START' });
        const result = classifyMessage(p, 'Hola buenas', 'individual');
        // phase is START so falls through to IGNORE
        expect(result.action).toBe('IGNORE');
    });
});

describe('classifier — Rule 6: unknown contact without trigger', () => {
    it('returns IGNORE for a completely unknown contact with a random message', () => {
        const result = classifyMessage(phone('c-15'), 'Hola buenos días', 'individual');
        expect(result.action).toBe('IGNORE');
        expect(result.reason).toBe('no_trigger_no_session');
    });
});
