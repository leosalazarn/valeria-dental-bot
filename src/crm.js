// CRM module — in-memory patient store with Supabase-ready interface
// TODO: Replace with Supabase client when scaling
// supabase.from('patients').select().eq('phone', phone)

import { getColombiaNow } from './utils/time.js';

const patients = new Map();

export function findPatient(phone) {
  return patients.get(phone) || null;
}

export function upsertPatient(data) {
  const existing = findPatient(data.phone);
  const now = getColombiaNow();

  if (existing) {
    patients.set(data.phone, {
      ...existing,
      ...data,
      last_interaction: now,
    });
  } else {
    patients.set(data.phone, {
      phone: data.phone,
      name: data.name || null,
      status: data.status || 'NEW',
      aesthetic_goal: data.aesthetic_goal || null,
      source: data.source || 'ORGANIC',
      trigger_message: data.trigger_message || null,
      first_contact: now,
      last_interaction: now,
      notes: data.notes || '',
      last_intent: data.last_intent || 'OTHER',
      full_name: data.full_name || null,
      email: data.email || null,
      consultation_reason: data.consultation_reason || null,
      data_complete: data.data_complete || false,
    });
  }

  // Set status to CONSULTATION_SCHEDULED when data is complete
  const patient = patients.get(data.phone);
  if (patient.data_complete) {
    patient.status = 'CONSULTATION_SCHEDULED';
    // TODO: POST to DentalLink API when integration is ready
  }
}

export function getAllPatients() {
  return Array.from(patients.values());
}

export function getStats() {
  const patientsArray = getAllPatients();
  const totalLeads = patientsArray.length;

  const bySource = patientsArray.reduce((acc, p) => {
    acc[p.source] = (acc[p.source] || 0) + 1;
    return acc;
  }, {});

  const byStatus = patientsArray.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const byIntent = patientsArray.reduce((acc, p) => {
    acc[p.last_intent] = (acc[p.last_intent] || 0) + 1;
    return acc;
  }, {});

  return { total_leads: totalLeads, by_source: bySource, by_status: byStatus, by_intent: byIntent };
}
