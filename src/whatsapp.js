// WhatsApp module — Meta API integration for sending messages
import {WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN} from './config.js';
import log from './utils/logger.js';

export async function sendMessage(to, text) {
    const url = `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to,
                type: 'text',
                text: {
                    preview_url: false,
                    body: text,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            log.error('WhatsApp API error', error);
        }
    } catch (error) {
        log.error('sendMessage', error);
    }
}

