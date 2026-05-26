import { describe, it, expect } from 'vitest';
import { containsBankDataLeak, auditOutput } from '../src/guardrails/output.js';
import { BANCOLOMBIA_ACCOUNT } from '../src/config.js';

describe('output guardrail — bank data leak detection', () => {
    it('flags bank data outside PAYMENT phase', () => {
        expect(containsBankDataLeak(`cuenta ${BANCOLOMBIA_ACCOUNT} ahorros`, 'EXTRACTION')).toBe(true);
        expect(containsBankDataLeak(`cuenta ${BANCOLOMBIA_ACCOUNT} ahorros`, 'HOOK')).toBe(true);
        expect(containsBankDataLeak(`cuenta ${BANCOLOMBIA_ACCOUNT} ahorros`, 'CLOSING')).toBe(true);
    });

    it('allows bank data in PAYMENT phase', () => {
        expect(containsBankDataLeak(`cuenta ${BANCOLOMBIA_ACCOUNT} ahorros`, 'PAYMENT')).toBe(false);
    });

    it('passes clean responses in any phase', () => {
        expect(containsBankDataLeak('¡Hola! ¿En qué te puedo ayudar?', 'EXTRACTION')).toBe(false);
        expect(containsBankDataLeak('La valoración cuesta $80.000', 'HOOK')).toBe(false);
    });

    it('auditOutput returns safe for clean responses', () => {
        const result = auditOutput('¿Cómo te llamas?', 'EXTRACTION');
        expect(result.safe).toBe(true);
        expect(result.text).toBe('¿Cómo te llamas?');
    });

    it('auditOutput returns safe:false and fallback message for leaks', () => {
        const result = auditOutput(`Tu cuenta es ${BANCOLOMBIA_ACCOUNT}`, 'HOOK');
        expect(result.safe).toBe(false);
        expect(result.reason).toBe('bank_data_leak');
        expect(result.text).toContain('equipo');
    });
});
