// Webhook routes — Meta webhook verification and message receiving
import express from 'express';
import {VERIFY_TOKEN, MSG_NON_TEXT, DEDUP_TTL_MS, MAX_BUFFER_SIZE, DEBOUNCE_MS} from '../config.js';
import {processMessage} from '../flow.js';
import log from '../utils/logger.js';

const router = express.Router();

// ── Deduplication — prevent Meta retries from processing same message twice
const processedIds = new Set();

function sanitizeInput(text) {
    // Basic cleaning: remove control characters and limit length
    return text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .slice(0, 1000) // Cap individual message length
        .trim();
}

function isDuplicate(messageId) {
    if (processedIds.has(messageId)) return true;
    processedIds.add(messageId);
    setTimeout(() => processedIds.delete(messageId), DEDUP_TTL_MS);
    return false;
}

// ── Message debounce buffer — accumulates rapid consecutive messages
const messageBuffers = new Map();
const BUFFER_HARD_CAP = 5;

function flushBuffer(phone, chatType) {
    const entry = messageBuffers.get(phone);
    if (!entry) return;
    clearTimeout(entry.timer);
    const combined = entry.messages.join('\n');
    messageBuffers.delete(phone);
    processMessage(phone, combined, chatType);
}

function debounceMessage(phone, text, chatType) {
    const sanitized = sanitizeInput(text);

    if (messageBuffers.has(phone)) {
        const entry = messageBuffers.get(phone);
        clearTimeout(entry.timer);

        // Anti-flood: only add if buffer is not full
        if (entry.messages.length < MAX_BUFFER_SIZE) {
            entry.messages.push(sanitized);
        } else if (entry.messages.length === MAX_BUFFER_SIZE) {
            entry.messages.push('... [mensajes omitidos por exceso]');
            log.warn(`Anti-flood triggered for ${phone}`);
        }
    } else {
        messageBuffers.set(phone, {messages: [sanitized], timer: null});
    }

    const entry = messageBuffers.get(phone);

    // Hard cap: process immediately at BUFFER_HARD_CAP messages
    if (entry.messages.length >= BUFFER_HARD_CAP) {
        flushBuffer(phone, chatType);
        return;
    }

    entry.timer = setTimeout(() => {
        flushBuffer(phone, chatType);
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