// Entry point — Express server initialization
import express from 'express';
import webhookRouter from './src/routes/webhook.js';
import debugRouter from './src/routes/debug.js';
import { PORT } from './src/config.js';
import { formatColombiaTime } from './src/utils/time.js';

const app = express();
app.use(express.json());

// Mount routes
app.use('/webhook', webhookRouter);
app.use('/', debugRouter);

// Start server
app.listen(PORT, () => {
  console.log(`\n🦷 Valeria listening on port ${PORT}`);
  console.log(`👩‍⚕️ Dra. Yuri Quintero — Odontología Estética · Neiva, Huila`);
  console.log(`🕐 ${formatColombiaTime()}\n`);
});
