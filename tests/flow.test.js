import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external I/O modules before any other imports
vi.mock('../src/ai.js', () => ({
    callValeria: vi.fn().mockResolvedValue('Hola! ¿Cómo te llamas?\nNAME: test'),
}));

vi.mock('../src/whatsapp.js', () => ({
    sendMessage: vi.fn().mockResolvedValue(undefined),
}));

import { processMessage, stripSignals, POSITIVE_RESPONSES } from '../src/flow.js';
import { sendMessage } from '../src/whatsapp.js';
import { callValeria } from '../src/ai.js';
import { updateSession, getSession } from '../src/session.js';
import { findPatient } from '../src/crm.js';

const phone = (n) => `+5734000${n}`;

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── stripSignals ────────────────────────────────────────────────────────────

describe('stripSignals', () => {
    it('removes NAME signal line', () => {
        expect(stripSignals('Hola!\nNAME: Carolina')).toBe('Hola!');
    });

    it('removes GOAL signal line', () => {
        expect(stripSignals('Entendido!\nGOAL: blanqueamiento')).toBe('Entendido!');
    });

    it('removes EXTRACTED signal line', () => {
        const text = 'Listo 😊\nEXTRACTED: full_name: María, email: m@m.com, consultation_reason: implantes';
        expect(stripSignals(text)).toBe('Listo 😊');
    });

    it('removes multiple signal lines at once', () => {
        const text = 'Texto visible\nNAME: Ana\nGOAL: calzas\nEXTRACTED: full_name: Ana Ruiz, email: a@b.com, consultation_reason: calzas';
        expect(stripSignals(text)).toBe('Texto visible');
    });

    it('leaves clean text untouched', () => {
        const text = '¡Claro! Te puedo ayudar con eso 😊';
        expect(stripSignals(text)).toBe(text);
    });
});

// ─── POSITIVE_RESPONSES ──────────────────────────────────────────────────────

describe('POSITIVE_RESPONSES', () => {
    it('is a non-empty array', () => {
        expect(Array.isArray(POSITIVE_RESPONSES)).toBe(true);
        expect(POSITIVE_RESPONSES.length).toBeGreaterThan(0);
    });

    it('contains core affirmative words', () => {
        expect(POSITIVE_RESPONSES).toContain('sí');
        expect(POSITIVE_RESPONSES).toContain('si');
        expect(POSITIVE_RESPONSES).toContain('ok');
        expect(POSITIVE_RESPONSES).toContain('dale');
        expect(POSITIVE_RESPONSES).toContain('agendar');
    });
});

// ─── processMessage — IGNORE ─────────────────────────────────────────────────

describe('processMessage — IGNORE classification', () => {
    it('does nothing for a group message', async () => {
        await processMessage(phone('f-01'), 'Hola a todos', 'group');
        expect(sendMessage).not.toHaveBeenCalled();
        expect(callValeria).not.toHaveBeenCalled();
    });

    it('does nothing for an unknown contact with no trigger', async () => {
        await processMessage(phone('f-02'), 'Hola, buenos días', 'individual');
        expect(sendMessage).not.toHaveBeenCalled();
        expect(callValeria).not.toHaveBeenCalled();
    });
});

// ─── processMessage — SUPPLIER ───────────────────────────────────────────────

describe('processMessage — SUPPLIER classification', () => {
    it('updates CRM to SUPPLIER status and sends no message', async () => {
        const p = phone('f-03');
        await processMessage(p, 'Le envío la factura del pedido', 'individual');
        expect(sendMessage).not.toHaveBeenCalled();
        expect(callValeria).not.toHaveBeenCalled();
        expect(findPatient(p)?.status).toBe('SUPPLIER');
    });
});

// ─── processMessage — WARM_LEAD / EXTRACTION phase ───────────────────────────

describe('processMessage — EXTRACTION phase (warm lead)', () => {
    it('calls Claude and sends AI response when name is unknown', async () => {
        const p = phone('f-04');
        // Trigger message starts a WARM_LEAD flow; session has no name yet
        await processMessage(p, 'Quiero mejorar mi sonrisa', 'individual');
        expect(callValeria).toHaveBeenCalledOnce();
        expect(sendMessage).toHaveBeenCalledOnce();
    });

    it('strips signals before sending to patient', async () => {
        const p = phone('f-05');
        callValeria.mockResolvedValueOnce('¿Cómo te llamas?\nNAME: Sofía\nGOAL: blanqueamiento');
        await processMessage(p, 'Quiero información', 'individual');
        const sentText = vi.mocked(sendMessage).mock.calls[0][1];
        expect(sentText).not.toContain('NAME:');
        expect(sentText).not.toContain('GOAL:');
        expect(sentText).toContain('¿Cómo te llamas?');
    });
});

// ─── processMessage — HOOK phase ─────────────────────────────────────────────

describe('processMessage — HOOK phase', () => {
    it('sends hardcoded hook message when name + goal are available after EXTRACTION', async () => {
        const p = phone('f-06');
        // Simulate: session already has name + goal, phase is still EXTRACTION
        updateSession(p, { name: 'Laura', aesthetic_goal: 'diseño de sonrisa', phase: 'EXTRACTION', source: 'AD_TRIGGER' });

        await processMessage(p, 'Sí, me interesa', 'individual');

        expect(callValeria).not.toHaveBeenCalled(); // hardcoded response, no AI needed
        expect(sendMessage).toHaveBeenCalledOnce();
        const sentText = vi.mocked(sendMessage).mock.calls[0][1];
        expect(sentText).toContain('Laura');
        expect(sentText).toContain('Dra. Yuri');
    });

    it('transitions session phase to HOOK', async () => {
        const p = phone('f-07');
        updateSession(p, { name: 'Juliana', aesthetic_goal: 'calzas', phase: 'EXTRACTION', source: 'AD_TRIGGER' });
        await processMessage(p, 'Bueno', 'individual');
        expect(getSession(p).phase).toBe('HOOK');
    });
});

// ─── processMessage — DATA_CAPTURE phase ─────────────────────────────────────

describe('processMessage — DATA_CAPTURE phase', () => {
    it('sends data capture request on positive response to HOOK', async () => {
        const p = phone('f-08');
        updateSession(p, { name: 'Mariela', aesthetic_goal: 'implantes', phase: 'HOOK', source: 'AD_TRIGGER' });

        await processMessage(p, 'sí, quiero agendar', 'individual');

        expect(callValeria).not.toHaveBeenCalled();
        expect(sendMessage).toHaveBeenCalledOnce();
        const sentText = vi.mocked(sendMessage).mock.calls[0][1];
        expect(sentText).toContain('Nombre completo');
        expect(sentText).toContain('Correo electrónico');
    });

    it('transitions session phase to DATA_CAPTURE', async () => {
        const p = phone('f-09');
        updateSession(p, { name: 'Carmen', aesthetic_goal: 'blanqueamiento', phase: 'HOOK', source: 'ORGANIC' });
        await processMessage(p, 'dale', 'individual');
        expect(getSession(p).phase).toBe('DATA_CAPTURE');
    });

    it('does NOT trigger DATA_CAPTURE on negative/neutral response', async () => {
        const p = phone('f-10');
        callValeria.mockResolvedValueOnce('Entiendo, sin problema. ¿Hay algo más?');
        updateSession(p, { name: 'Tania', aesthetic_goal: 'blanqueamiento', phase: 'HOOK', source: 'AD_TRIGGER' });
        await processMessage(p, 'Ahora no puedo', 'individual');
        // Should fall through to AI, not send hardcoded data capture form
        expect(callValeria).toHaveBeenCalledOnce();
    });
});
