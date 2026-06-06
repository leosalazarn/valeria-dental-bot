import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY, CLAUDE_MODEL, MAX_TOKENS } from './config.js';
import log from './utils/logger.js';

const ai = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const CLASSIFIER_SYSTEM = `Eres un clasificador de mensajes para una clínica dental. Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional.

Clasifica el mensaje del usuario como "SIMPLE" o "COMPLEX":

- SIMPLE: saludos, preguntas frecuentes (horarios, ubicación, precios generales), pasos básicos de agendamiento.
- COMPLEX: consultas médicas detalladas, múltiples intenciones en un solo mensaje, preguntas sobre tratamientos específicos que requieren análisis profundo del historial.

Ejemplos de respuesta:
{"route": "SIMPLE"}
{"route": "COMPLEX"}`;

function parseRoute(raw) {
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.route === 'string') {
            return parsed.route;
        }
        return null;
    } catch {
        return null;
    }
}

export async function classifyMessage(userMessage) {
    try {
        const response = await ai.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 50,
            system: CLASSIFIER_SYSTEM,
            messages: [{ role: 'user', content: userMessage }],
        });

        const route = parseRoute(response.content[0].text);
        if (route === 'SIMPLE' || route === 'COMPLEX') {
            return route;
        }

        log.warn('ModelRouterService', `Invalid classification "${response.content[0].text}" — falling back to SIMPLE`);
        return 'SIMPLE';
    } catch (error) {
        log.error('ModelRouterService classifyMessage', error?.message || error);
        return 'SIMPLE';
    }
}

export function routeMessage(userMessage) {
    return classifyMessage(userMessage).then((route) => {
        if (route === 'COMPLEX') {
            return {
                route: 'COMPLEX',
                model: 'claude-3-7-sonnet-latest',
                maxTokens: MAX_TOKENS,
            };
        }

        return {
            route: 'SIMPLE',
            model: CLAUDE_MODEL,
            maxTokens: MAX_TOKENS,
        };
    });
}
