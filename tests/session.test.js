import { describe, it, expect, vi } from 'vitest';
import {
    getSession,
    updateSession,
    addMessageToHistory,
    clearReengagementTimer,
    setReengagementTimer,
} from '../src/session.js';
import { MAX_HISTORY } from '../src/config.js';

const phone = (n) => `+5731000${n}`;

describe('session — getSession', () => {
    it('creates a new session with defaults for unknown phone', () => {
        const session = getSession(phone('s-01'));
        expect(session.history).toEqual([]);
        expect(session.name).toBeNull();
        expect(session.aesthetic_goal).toBeNull();
        expect(session.phase).toBe('START');
        expect(session.source).toBe('ORGANIC');
        expect(session.data_complete).toBe(false);
        expect(session.last_interaction).toBeTruthy();
    });

    it('returns the same session object on subsequent calls', () => {
        const p = phone('s-02');
        const s1 = getSession(p);
        const s2 = getSession(p);
        expect(s1).toBe(s2);
    });

    it('updates last_interaction on every access', async () => {
        const p = phone('s-03');
        const t1 = getSession(p).last_interaction;
        await new Promise(r => setTimeout(r, 5));
        const t2 = getSession(p).last_interaction;
        expect(t2).not.toBe(t1);
    });
});

describe('session — updateSession', () => {
    it('merges data into existing session', () => {
        const p = phone('s-04');
        getSession(p);
        updateSession(p, { name: 'Luisa', aesthetic_goal: 'diseño de sonrisa' });
        const session = getSession(p);
        expect(session.name).toBe('Luisa');
        expect(session.aesthetic_goal).toBe('diseño de sonrisa');
    });

    it('does not wipe unrelated fields', () => {
        const p = phone('s-05');
        getSession(p);
        updateSession(p, { name: 'Jorge' });
        updateSession(p, { aesthetic_goal: 'blanqueamiento' });
        const session = getSession(p);
        expect(session.name).toBe('Jorge');
        expect(session.aesthetic_goal).toBe('blanqueamiento');
    });

    it('updates phase correctly', () => {
        const p = phone('s-06');
        getSession(p);
        updateSession(p, { phase: 'HOOK' });
        expect(getSession(p).phase).toBe('HOOK');
    });
});

describe('session — addMessageToHistory', () => {
    it('appends user and assistant messages', () => {
        const p = phone('s-07');
        addMessageToHistory(p, 'user', 'Hola');
        addMessageToHistory(p, 'assistant', 'Hola! ¿Cómo te llamas?');
        const { history } = getSession(p);
        expect(history).toHaveLength(2);
        expect(history[0]).toEqual({ role: 'user', content: 'Hola' });
        expect(history[1]).toEqual({ role: 'assistant', content: 'Hola! ¿Cómo te llamas?' });
    });

    it(`enforces sliding window of MAX_HISTORY (${MAX_HISTORY}) messages`, () => {
        const p = phone('s-08');
        for (let i = 0; i < MAX_HISTORY + 5; i++) {
            addMessageToHistory(p, 'user', `msg ${i}`);
        }
        expect(getSession(p).history).toHaveLength(MAX_HISTORY);
    });

    it('drops oldest message when window is full', () => {
        const p = phone('s-09');
        for (let i = 0; i < MAX_HISTORY; i++) {
            addMessageToHistory(p, 'user', `msg ${i}`);
        }
        addMessageToHistory(p, 'user', 'newest');
        const { history } = getSession(p);
        expect(history[0].content).toBe('msg 1');
        expect(history[history.length - 1].content).toBe('newest');
    });
});

describe('session — reengagement timers', () => {
    it('clearReengagementTimer is safe when no timer is set', () => {
        expect(() => clearReengagementTimer(phone('s-10'))).not.toThrow();
    });

    it('setReengagementTimer fires the callback after delay', async () => {
        vi.useFakeTimers();
        const p = phone('s-11');
        getSession(p);
        const callback = vi.fn();
        setReengagementTimer(p, callback, 1000);
        expect(callback).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalledOnce();
        vi.useRealTimers();
    });

    it('clearReengagementTimer cancels the callback', async () => {
        vi.useFakeTimers();
        const p = phone('s-12');
        getSession(p);
        const callback = vi.fn();
        setReengagementTimer(p, callback, 1000);
        clearReengagementTimer(p);
        vi.advanceTimersByTime(2000);
        expect(callback).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('setting a new timer cancels the previous one', () => {
        vi.useFakeTimers();
        const p = phone('s-13');
        getSession(p);
        const first = vi.fn();
        const second = vi.fn();
        setReengagementTimer(p, first, 500);
        setReengagementTimer(p, second, 500); // replaces first
        vi.advanceTimersByTime(500);
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();
        vi.useRealTimers();
    });
});
