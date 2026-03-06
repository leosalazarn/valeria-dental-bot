// Webhook routes — Meta webhook verification and message receiving
import express from 'express';
import { VERIFY_TOKEN } from '../config.js';
import { processMessage } from '../flow.js';
import log from '../utils/logger.js';

const router = express.Router();

// GET /webhook — Meta verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    log.success('Webhook verified by Meta');
    res.status(200).send(challenge);
  } else {
    log.warn('Webhook verification', 'Invalid token or mode');
    res.sendStatus(403);
  }
});

// POST /webhook — receive WhatsApp messages
router.post('/webhook', async (req, res) => {
  // Respond to Meta immediately (< 5 seconds)
  res.sendStatus(200);

  try {
    const body = req.body;
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages) return;

    const mensaje = value.messages[0];

    // Only process text messages
    if (mensaje.type !== 'text') {
      const numero = mensaje.from;
      const response = await import('../whatsapp.js');
      await response.sendMessage(numero, 'Por el momento solo puedo responder mensajes de texto 😊 ¿En qué te puedo ayudar?');
      return;
    }

    const numeroWA = mensaje.from;
    const texto = mensaje.text.body.trim();
    const chatType = value.contacts?.[0]?.profile?.name ? 'individual' : 'group';

    // Process message asynchronously
    processMessage(numeroWA, texto, chatType);

  } catch (error) {
    log.error('POST /webhook', error);
  }
});

export default router;

