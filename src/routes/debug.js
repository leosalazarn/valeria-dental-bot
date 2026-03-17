// Debug routes — CRM inspection and statistics
import express from 'express';
import {getAllPatients, getStats} from '../crm.js';
import {getAllSessions} from '../session.js';
import {formatColombiaTime} from '../utils/time.js';
import {PRACTICE_NAME, PRACTICE_LOCATION} from '../config.js';

const router = express.Router();

// GET / — health check
router.get('/', (req, res) => {
    res.json({
        status: '🦷 Valeria activa',
        service: `${PRACTICE_NAME} · ${PRACTICE_LOCATION}`,
        hora: formatColombiaTime(),
    });
});

// GET /leads — all patients for debugging
router.get('/leads', (req, res) => {
    const patients = getAllPatients();
    res.json({patients});
});

// GET /stats — CRM lead statistics
router.get('/stats', (req, res) => {
    const stats = getStats();
    res.json(stats);
});

// GET /metrics — conversion funnel + response time + reengagement stats
router.get('/metrics', (req, res) => {
    const sessions = getAllSessions();
    const total = sessions.length;

    if (total === 0) {
        return res.json({ message: 'No active sessions yet.' });
    }

    // ── Funnel: how many sessions reached each phase
    const phases = ['START', 'EXTRACTION', 'HOOK', 'DATA_CAPTURE', 'PAYMENT', 'CLOSING'];
    const funnel = {};
    for (const phase of phases) {
        const reached = sessions.filter(s =>
            s.metrics?.phase_timestamps?.[phase] !== null &&
            s.metrics?.phase_timestamps?.[phase] !== undefined
        ).length;
        funnel[phase] = {
            count: reached,
            rate: total > 0 ? `${((reached / total) * 100).toFixed(1)}%` : '0%',
        };
    }

    // ── Drop-off between consecutive phases
    const dropoff = {};
    for (let i = 1; i < phases.length; i++) {
        const from = phases[i - 1];
        const to = phases[i];
        const fromCount = funnel[from].count;
        const toCount = funnel[to].count;
        const lost = fromCount - toCount;
        dropoff[`${from} → ${to}`] = {
            lost,
            drop_rate: fromCount > 0 ? `${((lost / fromCount) * 100).toFixed(1)}%` : '0%',
        };
    }

    // ── Response time: avg ms from first contact to first Valeria reply
    const responseTimes = sessions
        .map(s => s.metrics?.first_response_ms)
        .filter(t => t !== null && t !== undefined);
    const avgResponseMs = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : null;

    // ── Time to convert: avg ms from first contact to reaching PAYMENT phase
    const timeToPayment = sessions
        .filter(s => s.metrics?.phase_timestamps?.PAYMENT)
        .map(s => new Date(s.metrics.phase_timestamps.PAYMENT) - new Date(s.metrics.first_contact));
    const avgTimeToPaymentMin = timeToPayment.length > 0
        ? Math.round(timeToPayment.reduce((a, b) => a + b, 0) / timeToPayment.length / 60000)
        : null;

    // ── Reengagement stats
    const reengagementSent = sessions.filter(s => s.metrics?.reengagement_sent).length;
    const reengagementRecovered = sessions.filter(s => s.metrics?.reengagement_recovered).length;

    // ── Source breakdown
    const bySource = sessions.reduce((acc, s) => {
        acc[s.source] = (acc[s.source] || 0) + 1;
        return acc;
    }, {});

    res.json({
        generated_at: formatColombiaTime(),
        total_sessions: total,
        funnel,
        dropoff,
        response_time: {
            avg_first_response_ms: avgResponseMs,
            avg_first_response_s: avgResponseMs ? (avgResponseMs / 1000).toFixed(1) : null,
            sample_size: responseTimes.length,
        },
        time_to_payment: {
            avg_minutes: avgTimeToPaymentMin,
            sample_size: timeToPayment.length,
        },
        reengagement: {
            sent: reengagementSent,
            recovered: reengagementRecovered,
            recovery_rate: reengagementSent > 0
                ? `${((reengagementRecovered / reengagementSent) * 100).toFixed(1)}%`
                : '0%',
        },
        by_source: bySource,
    });
});

export default router;