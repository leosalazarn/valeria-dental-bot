import { describe, it, expect } from 'vitest';
import { classifyMessage } from '../src/classifier.js';
import { upsertPatient } from '../src/crm.js';
import { updateSession } from '../src/session.js';

const phone = (n) => `+5732000${n}`;

describe('classifier — Rule 1: group messages', () => {
    it('returns IGNORE for any group message', () => {
        const result = classifyMessage(phone('c-01'), 'Hola a todos', 'group');
        expect(result.action).toBe('IGNORE');
        expect(result.reason).toBe('group_message');
    });

    it('ignores any message if sent from a group', () => {
        const result = classifyMessage(phone('c-02'), 'Quiero agendar', 'group');
        expect(result.action).toBe('IGNORE');
    });
});

describe('classifier — Rule 2: in-treatment patient', () => {
    it('returns CURRENT_PATIENT for a phone with status IN_TREATMENT', () => {
        const p = phone('c-03');
        upsertPatient({ phone: p, status: 'IN_TREATMENT' });
        const result = classifyMessage(p, 'Tengo una duda', 'individual');
        expect(result.action).toBe('CURRENT_PATIENT');
        expect(result.reason).toBe('in_treatment');
    });

    it('does NOT return CURRENT_PATIENT for PROSPECT status', () => {
        const p = phone('c-04');
        upsertPatient({ phone: p, status: 'PROSPECT' });
        const result = classifyMessage(p, 'Una pregunta', 'individual');
        expect(result.action).not.toBe('CURRENT_PATIENT');
    });
});

describe('classifier — Rule 3: active session (organic lead)', () => {
    it('returns ORGANIC_LEAD when session phase is not START', () => {
        const p = phone('c-05');
        updateSession(p, { phase: 'EXTRACTION' });
        const result = classifyMessage(p, 'Quiero hacerme los dientes', 'individual');
        expect(result.action).toBe('ORGANIC_LEAD');
        expect(result.source).toBe('ORGANIC');
    });

    it('does NOT return ORGANIC_LEAD when phase is START', () => {
        const p = phone('c-06');
        updateSession(p, { phase: 'START' });
        const result = classifyMessage(p, 'Hola buenas', 'individual');
        expect(result.action).not.toBe('ORGANIC_LEAD');
    });
});

describe('classifier — Rule 4: new contact (warm lead)', () => {
    it('returns WARM_LEAD for any new individual contact', () => {
        const result = classifyMessage(phone('c-07'), 'Hola buenos días', 'individual');
        expect(result.action).toBe('WARM_LEAD');
        expect(result.source).toBe('DIRECT');
    });

    it('returns WARM_LEAD even for unrelated messages', () => {
        const result = classifyMessage(phone('c-08'), 'Le envío la factura del pedido', 'individual');
        expect(result.action).toBe('WARM_LEAD');
    });

    it('returns WARM_LEAD for price questions', () => {
        const result = classifyMessage(phone('c-09'), 'Que precio tiene?', 'individual');
        expect(result.action).toBe('WARM_LEAD');
    });
});