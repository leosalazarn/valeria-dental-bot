// Entry point — Express server initialization
import express from 'express';
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

// Serve static dashboard and assets
app.use(express.static(join(__dirname, 'public')));
app.use('/assets', express.static(join(__dirname, 'assets')));

// Mount routes
app.use('/webhook', webhookRouter);
app.use('/debug', debugRouter);

// Start server
app.listen(PORT, () => {
    console.log(`\n🦷 Valeria listening on port ${PORT}`);
    console.log(`👩‍⚕️ Dra. Yuri Quintero — Odontología Estética · Neiva, Huila`);
    console.log(`🕐 ${formatColombiaTime()}\n`);
});
