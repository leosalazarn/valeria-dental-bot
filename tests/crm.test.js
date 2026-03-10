import { describe, it, expect } from 'vitest';
import { findPatient, upsertPatient, getAllPatients, getStats } from '../src/crm.js';

// Use unique phone prefixes per test to avoid cross-test state pollution
const phone = (n) => `+5730000${n}`;

describe('crm — findPatient', () => {
    it('returns null for unknown phone', () => {
        expect(findPatient(phone('crm-01'))).toBeNull();
    });

    it('returns the patient after upsert', () => {
        const p = phone('crm-02');
        upsertPatient({ phone: p, name: 'Camila' });
        expect(findPatient(p)).not.toBeNull();
        expect(findPatient(p).name).toBe('Camila');
    });
});

describe('crm — upsertPatient (create)', () => {
    it('creates patient with defaults', () => {
        const p = phone('crm-03');
        upsertPatient({ phone: p });
        const patient = findPatient(p);

        expect(patient.phone).toBe(p);
        expect(patient.status).toBe('NEW');
        expect(patient.source).toBe('ORGANIC');
        expect(patient.data_complete).toBe(false);
        expect(patient.name).toBeNull();
        expect(patient.aesthetic_goal).toBeNull();
        expect(patient.first_contact).toBeTruthy();
        expect(patient.last_interaction).toBeTruthy();
    });

    it('stores provided values on creation', () => {
        const p = phone('crm-04');
        upsertPatient({
            phone: p,
            name: 'Laura',
            aesthetic_goal: 'blanqueamiento',
            source: 'AD_TRIGGER',
            trigger_message: 'Quiero mejorar mi sonrisa',
        });
        const patient = findPatient(p);

        expect(patient.name).toBe('Laura');
        expect(patient.aesthetic_goal).toBe('blanqueamiento');
        expect(patient.source).toBe('AD_TRIGGER');
        expect(patient.trigger_message).toBe('Quiero mejorar mi sonrisa');
    });
});

describe('crm — upsertPatient (update)', () => {
    it('merges new data into existing patient', () => {
        const p = phone('crm-05');
        upsertPatient({ phone: p, name: 'Ana' });
        upsertPatient({ phone: p, name: 'Ana María', aesthetic_goal: 'implantes' });
        const patient = findPatient(p);

        expect(patient.name).toBe('Ana María');
        expect(patient.aesthetic_goal).toBe('implantes');
    });

    it('preserves first_contact on update', () => {
        const p = phone('crm-06');
        upsertPatient({ phone: p, name: 'Sofía' });
        const firstContact = findPatient(p).first_contact;

        upsertPatient({ phone: p, aesthetic_goal: 'calzas' });

        expect(findPatient(p).first_contact).toBe(firstContact);
    });

    it('updates last_interaction on every upsert', async () => {
        const p = phone('crm-07');
        upsertPatient({ phone: p, name: 'Julia' });
        const t1 = findPatient(p).last_interaction;

        await new Promise(r => setTimeout(r, 5));
        upsertPatient({ phone: p, aesthetic_goal: 'diseño de sonrisa' });

        expect(findPatient(p).last_interaction).not.toBe(t1);
    });
});

describe('crm — auto status promotion', () => {
    it('sets status to CONSULTATION_SCHEDULED when data_complete is true', () => {
        const p = phone('crm-08');
        upsertPatient({
            phone: p,
            full_name: 'María Fernanda López',
            email: 'maria@example.com',
            consultation_reason: 'blanqueamiento',
            data_complete: true,
        });
        expect(findPatient(p).status).toBe('CONSULTATION_SCHEDULED');
    });

    it('does NOT promote status when data_complete is false', () => {
        const p = phone('crm-09');
        upsertPatient({ phone: p, name: 'Pedro', data_complete: false });
        expect(findPatient(p).status).toBe('NEW');
    });
});

describe('crm — getAllPatients', () => {
    it('returns an array', () => {
        expect(Array.isArray(getAllPatients())).toBe(true);
    });

    it('includes previously created patients', () => {
        const p = phone('crm-10');
        upsertPatient({ phone: p, name: 'CRM list test' });
        const all = getAllPatients();
        expect(all.some(pt => pt.phone === p)).toBe(true);
    });
});

describe('crm — getStats', () => {
    it('returns correct shape', () => {
        const stats = getStats();
        expect(stats).toHaveProperty('total_leads');
        expect(stats).toHaveProperty('by_source');
        expect(stats).toHaveProperty('by_status');
        expect(stats).toHaveProperty('by_intent');
    });

    it('counts patients by source', () => {
        const p1 = phone('crm-11');
        const p2 = phone('crm-12');
        upsertPatient({ phone: p1, source: 'AD_TRIGGER' });
        upsertPatient({ phone: p2, source: 'AD_TRIGGER' });

        const stats = getStats();
        expect(stats.by_source['AD_TRIGGER']).toBeGreaterThanOrEqual(2);
    });

    it('counts patients by status', () => {
        const p = phone('crm-13');
        upsertPatient({ phone: p, status: 'SUPPLIER' });

        const stats = getStats();
        expect(stats.by_status['SUPPLIER']).toBeGreaterThanOrEqual(1);
    });
});
