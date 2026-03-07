// Debug routes — CRM inspection and statistics
import express from 'express';
import {getAllPatients, getStats} from '../crm.js';
import {formatColombiaTime} from '../utils/time.js';
import {PRACTICE_NAME, PRACTICE_LOCATION} from '../config.js';

const router = express.Router();

// GET / — health check
router.get('/', (req, res) => {
    res.json({
        status: '🦷 Valeria activa',
        servicio: `${PRACTICE_NAME} · ${PRACTICE_LOCATION}`,
        hora: formatColombiaTime(),
    });
});

// GET /leads — all patients for debugging
router.get('/leads', (req, res) => {
    const patients = getAllPatients();
    res.json({patients});
});

// GET /stats — lead statistics
router.get('/stats', (req, res) => {
    const stats = getStats();
    res.json(stats);
});

export default router;

