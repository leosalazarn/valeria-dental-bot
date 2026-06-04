// Entry point — Express server initialization
import crypto from 'crypto';
import express from 'express';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import webhookRouter from './src/routes/webhook.js';
import debugRouter from './src/routes/debug.js';
import {PORT, DEBUG_API_KEY} from './src/config.js';
import {formatColombiaTime} from './src/utils/time.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Server-side session — HttpOnly cookie, no API key stored on client
const SESSION_SECRET = crypto.createHash('sha256').update(DEBUG_API_KEY).digest('hex');
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
    },
}));

// Dashboard login — validates API key and establishes server-side session
app.post('/dashboard/login', (req, res) => {
    if (req.body?.apiKey === DEBUG_API_KEY) {
        req.session.authenticated = true;
        return res.json({success: true});
    }
    return res.status(401).json({success: false, error: 'Invalid API key'});
});

// Dashboard session check — confirms existing session without exposing the key
app.get('/dashboard/check-session', (req, res) => {
    res.json({authenticated: !!req.session?.authenticated});
});

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
