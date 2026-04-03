// Webhook routes — Meta webhook verification and message receiving
import express from 'express';
import {VERIFY_TOKEN, MSG_NON_TEXT} from '../config.js';
import {processMessage} from '../flow.js';
import log from '../utils/logger.js';

const router = express.Router();

// ── Deduplication — prevent Meta retries from processing same message twice
const processedIds = new Set();
const DEDUP_TTL_MS = 60 * 1000; // forget message IDs after 1 minute

function isDuplicate(messageId) {
    if (processedIds.has(messageId)) return true;
    processedIds.add(messageId);
    setTimeout(() => processedIds.delete(messageId), DEDUP_TTL_MS);
    return false;
}

// ── Message debounce buffer — accumulates rapid consecutive messages
const messageBuffers = new Map();
const DEBOUNCE_MS = 5000; // 5s — tight enough to feel instant, wide enough to catch bursts

function debounceMessage(phone, text, chatType) {
    if (messageBuffers.has(phone)) {
        const entry = messageBuffers.get(phone);
        clearTimeout(entry.timer);
        entry.messages.push(text);
    } else {
        messageBuffers.set(phone, {messages: [text], timer: null});
    }

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

    // Sanitize challenge — must be a plain numeric string (Meta always sends a number)
    const safeChallenge = /^\d+$/.test(challenge) ? challenge : '';

    if (mode === 'subscribe' && token === VERIFY_TOKEN && safeChallenge) {
        log.success('Webhook verified by Meta');
        res.status(200).send(safeChallenge);
    } else {
        log.warn('Webhook verification', 'Invalid token, mode, or challenge');
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

        const message = value.messages[0];

        // Deduplicate — ignore Meta retries
        if (isDuplicate(message.id)) {
            log.info(`Duplicate message ignored: ${message.id}`);
            return;
        }

        // Only process text messages
        if (message.type !== 'text') {
            const phone = message.from;
            const response = await import('../whatsapp.js');
            await response.sendMessage(phone, MSG_NON_TEXT);
            return;
        }

        const phoneWA = message.from;
        const text = message.text.body.trim();
        const chatType = value.contacts?.[0]?.profile?.name ? 'individual' : 'group';

        // Debounce — wait 10s to group consecutive messages
        debounceMessage(phoneWA, text, chatType);

    } catch (error) {
        log.error('POST /webhook', error);
    }
});

export default router;