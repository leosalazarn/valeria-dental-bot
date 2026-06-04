// Entry point — Express server initialization
import express from 'express';
import rateLimit from 'express-rate-limit';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import webhookRouter from './src/routes/webhook.js';
import debugRouter from './src/routes/debug.js';
import {PORT} from './src/config.js';
import {formatColombiaTime} from './src/utils/time.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Rate limit: 30 requests per 15 min per IP for dashboard and debug endpoints
const getLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
});

// Serve assets (logo) and dashboard on non-obvious route
app.use('/assets', express.static(join(__dirname, 'assets')));
app.get('/dashboard-valeria-statistics', getLimiter, (_req, res) => {
    res.sendFile(join(__dirname, 'public', 'dashboard.html'));
});

// Mount routes
app.use('/webhook', webhookRouter);
app.use('/debug', debugRouter);

// Start server
app.listen(PORT, () => {
    console.log(`\n🦷 Valeria listening on port ${PORT}`);
    console.log(`👩‍⚕️ Dra. Yuri Quintero — Odontología Estética · Neiva, Huila`);
    console.log(`🕐 ${formatColombiaTime()}\n`);
});
