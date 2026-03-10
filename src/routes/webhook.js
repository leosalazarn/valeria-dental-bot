// Webhook routes — Meta webhook verification and message receiving
import express from 'express';
import {VERIFY_TOKEN, MSG_NON_TEXT} from '../config.js';
import {processMessage} from '../flow.js';
import log from '../utils/logger.js';

const router = express.Router();

// ── Message debounce buffer (30 seconds per phone number) ────
const messageBuffers = new Map();
const DEBOUNCE_MS = 10000;

function debounceMessage(phone, text, chatType) {
    // If timer exists, cancel it and append message
    if (messageBuffers.has(phone)) {
        const entry = messageBuffers.get(phone);
        clearTimeout(entry.timer);
        entry.messages.push(text);
    } else {
        messageBuffers.set(phone, {messages: [text], timer: null});
    }

    // Start new 30s timer
    const entry = messageBuffers.get(phone);
    entry.timer = setTimeout(async () => {
        const combined = entry.messages.join('\n');
        messageBuffers.delete(phone);
        await processMessage(phone, combined, chatType);
    }, DEBOUNCE_MS);
}

// GET / — Meta verification (mounted at /webhook in server.js)
router.get('/', (req, res) => {
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

// POST / — receive WhatsApp messages (mounted at /webhook in server.js)
router.post('/', async (req, res) => {
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
            await response.sendMessage(numero, MSG_NON_TEXT);
            return;
        }

        const numeroWA = mensaje.from;
        const texto = mensaje.text.body.trim();
        const chatType = value.contacts?.[0]?.profile?.name ? 'individual' : 'group';

        // Debounce — wait 30s to group consecutive messages
        debounceMessage(numeroWA, texto, chatType);

    } catch (error) {
        log.error('POST /webhook', error);
    }
});

export default router;