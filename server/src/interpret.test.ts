import { describe, it, expect } from 'vitest';
import { interpretPrompt } from './routes/interpret.js';

describe('interpretPrompt Error Resilience', () => {
  it('should handle empty string without throwing', async () => {
    await expect(interpretPrompt('')).resolves.toBeDefined();
    const result = await interpretPrompt('');
    expect(result.actors.length).toBeGreaterThanOrEqual(1);
    expect(result.environment).toBeDefined();
  });

  it('should handle emoji-only prompt without throwing', async () => {
    const emojiPrompt = '🎭👾🔥✨🎬';
    await expect(interpretPrompt(emojiPrompt)).resolves.toBeDefined();
    const result = await interpretPrompt(emojiPrompt);
    expect(result.actors.length).toBeGreaterThanOrEqual(1);
    expect(result.environment).toBeDefined();
  });

  it('should handle extremely long (10,000-character) prompt without throwing', async () => {
    const longPrompt = 'a'.repeat(10000);
    await expect(interpretPrompt(longPrompt)).resolves.toBeDefined();
    const result = await interpretPrompt(longPrompt);
    expect(result.actors.length).toBeGreaterThanOrEqual(1);
    expect(result.environment).toBeDefined();
  });

  it('should handle pure nonsense prompt without throwing', async () => {
    const nonsensePrompt = 'asdfkjsahfdlkjas dhfskajlhfdskajlhfdskajlh dfsakjlh';
    await expect(interpretPrompt(nonsensePrompt)).resolves.toBeDefined();
    const result = await interpretPrompt(nonsensePrompt);
    expect(result.actors.length).toBeGreaterThanOrEqual(1);
    expect(result.environment).toBeDefined();
  });
});
