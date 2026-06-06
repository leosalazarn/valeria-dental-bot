import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock('@anthropic-ai/sdk', () => ({
    default: vi.fn(function () {
        return { messages: { create: mockCreate } };
    }),
}));

import { classifyMessage, routeMessage } from '../src/model-router.js';
import { CLAUDE_MODEL, MAX_TOKENS } from '../src/config.js';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('classifyMessage', () => {
    it('returns SIMPLE for a greeting message', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ text: '{"route": "SIMPLE"}' }],
        });

        const result = await classifyMessage('Hola, ¿cuándo abren?');

        expect(result).toBe('SIMPLE');
        expect(mockCreate).toHaveBeenCalledOnce();
        expect(mockCreate.mock.calls[0][0].model).toBe(CLAUDE_MODEL);
    });

    it('returns COMPLEX for a multi-intent message', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ text: '{"route": "COMPLEX"}' }],
        });

        const result = await classifyMessage(
            'Me duele una muela pero también quiero saber cuánto cuesta el blanqueamiento y si tienen financiación'
        );

        expect(result).toBe('COMPLEX');
    });

    it('falls back to SIMPLE when the API returns invalid JSON', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ text: 'Claro, aquí tienes la información...' }],
        });

        const result = await classifyMessage('Hola');

        expect(result).toBe('SIMPLE');
    });

    it('falls back to SIMPLE when the API throws', async () => {
        mockCreate.mockRejectedValueOnce(new Error('API timeout'));

        const result = await classifyMessage('Hola');

        expect(result).toBe('SIMPLE');
    });
});

describe('routeMessage', () => {
    it('returns Haiku config for SIMPLE classification', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ text: '{"route": "SIMPLE"}' }],
        });

        const config = await routeMessage('Hola');

        expect(config).toEqual({
            route: 'SIMPLE',
            model: CLAUDE_MODEL,
            maxTokens: MAX_TOKENS,
        });
    });

    it('returns Sonnet config for COMPLEX classification', async () => {
        mockCreate.mockResolvedValueOnce({
            content: [{ text: '{"route": "COMPLEX"}' }],
        });

        const config = await routeMessage('Me duele una muela...');

        expect(config).toEqual({
            route: 'COMPLEX',
            model: 'claude-3-7-sonnet-latest',
            maxTokens: MAX_TOKENS,
        });
    });
});
