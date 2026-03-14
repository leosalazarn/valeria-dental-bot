import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildCurrentPatientPrompt } from '../src/prompt.js';
import { CONSULTATION_PRICE, BOOK_PRICE } from '../src/config.js';

const baseSession = { phase: 'EXTRACTION', source: 'ORGANIC' };

describe('buildSystemPrompt — core content', () => {
    it('includes Valeria persona', () => {
        const prompt = buildSystemPrompt(baseSession);
        expect(prompt).toContain('Valeria');
    });

    it('includes the practice name', () => {
        const prompt = buildSystemPrompt(baseSession);
        expect(prompt).toContain('Dra. Yuri Quintero');
    });

    it('mentions consultation price', () => {
        const prompt = buildSystemPrompt(baseSession);
        expect(prompt).toContain(String(CONSULTATION_PRICE));
    });

    it('mentions the booking deposit amount', () => {
        const prompt = buildSystemPrompt(baseSession);
        expect(prompt).toContain(String(BOOK_PRICE));
    });

    it('includes the no-prices rule', () => {
        const prompt = buildSystemPrompt(baseSession);
        expect(prompt.toLowerCase()).toContain('precio');
    });

    it('includes format constraints (3 lines, 1 emoji)', () => {
        const prompt = buildSystemPrompt(baseSession);
        expect(prompt).toContain('3');
    });

    it('includes NAME and GOAL signal instructions', () => {
        const prompt = buildSystemPrompt(baseSession);
        expect(prompt).toContain('NAME:');
        expect(prompt).toContain('GOAL:');
    });
});

describe('buildSystemPrompt — direct contact context', () => {
    it('includes direct contact context for any source', () => {
        const prompt = buildSystemPrompt({ ...baseSession, source: 'DIRECT' });
        expect(prompt).toContain('CONTEXTO DE CONTACTO');
    });

    it('does NOT include AD_TRIGGER or organic lead sections', () => {
        const prompt = buildSystemPrompt({ ...baseSession, source: 'DIRECT' });
        expect(prompt).not.toContain('lead caliente');
        expect(prompt).not.toContain('CONTEXTO DE LEAD ORGÁNICO');
    });
});

describe('buildSystemPrompt — DATA_CAPTURE phase', () => {
    it('includes data capture instructions', () => {
        const session = { ...baseSession, phase: 'DATA_CAPTURE', data_complete: false };
        const prompt = buildSystemPrompt(session);
        expect(prompt).toContain('CAPTURA DE DATOS');
        expect(prompt).toContain('EXTRACTED:');
    });

    it('does NOT include data capture instructions in other phases', () => {
        const prompt = buildSystemPrompt({ ...baseSession, phase: 'EXTRACTION' });
        expect(prompt).not.toContain('CAPTURA DE DATOS');
    });
});

describe('buildSystemPrompt — PAYMENT phase', () => {
    it('includes banking details', () => {
        const session = { ...baseSession, phase: 'PAYMENT' };
        const prompt = buildSystemPrompt(session);
        expect(prompt).toContain('Bancolombia');
        expect(prompt).toContain('Nequi');
        expect(prompt).toContain('Davivienda');
    });

    it('contains the bank account from env', () => {
        const session = { ...baseSession, phase: 'PAYMENT' };
        const prompt = buildSystemPrompt(session);
        expect(prompt).toContain(process.env.BANCOLOMBIA_ACCOUNT);
    });
});

describe('buildSystemPrompt — CLOSING phase', () => {
    it('includes closing instructions', () => {
        const prompt = buildSystemPrompt({ ...baseSession, phase: 'CLOSING' });
        expect(prompt).toContain('CIERRE');
    });
});

describe('buildSystemPrompt — session context injection', () => {
    it('injects patient name', () => {
        const prompt = buildSystemPrompt({ ...baseSession, name: 'Valentina' });
        expect(prompt).toContain('Valentina');
    });

    it('injects aesthetic goal', () => {
        const prompt = buildSystemPrompt({ ...baseSession, aesthetic_goal: 'implantes' });
        expect(prompt).toContain('implantes');
    });

    it('injects captured email', () => {
        const prompt = buildSystemPrompt({ ...baseSession, email: 'test@example.com' });
        expect(prompt).toContain('test@example.com');
    });
});

describe('buildCurrentPatientPrompt', () => {
    it('returns a non-empty string', () => {
        const prompt = buildCurrentPatientPrompt();
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
    });

    it('references the practice', () => {
        expect(buildCurrentPatientPrompt()).toContain('Dra. Yuri Quintero');
    });

    it('includes post-treatment instructions', () => {
        const prompt = buildCurrentPatientPrompt();
        expect(prompt.toLowerCase()).toContain('tratamiento');
    });
});