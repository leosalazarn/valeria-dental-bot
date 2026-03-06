// AI module — Claude API integration
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY, CLAUDE_MODEL, MAX_TOKENS } from './config.js';
import log from './utils/logger.js';

const ai = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export async function callValeria(history, systemPrompt) {
  try {
    const response = await ai.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: history,
    });

    return response.content[0].text;
  } catch (error) {
    log.error('Claude API call', error);
    throw error;
  }
}

