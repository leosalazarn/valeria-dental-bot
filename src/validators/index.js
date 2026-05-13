export function sanitizeText(text) {
    return text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .slice(0, 1000)
        .trim();
}

export function isValidPhone(phone) {
    return typeof phone === 'string' && phone.length > 5 && phone.length < 20;
}

export function isValidWebhookChallenge(challenge) {
    return /^\d+$/.test(challenge);
}
