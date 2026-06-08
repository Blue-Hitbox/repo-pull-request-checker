import { getProvider, OpenAIProvider, ClaudeProvider, OpenRouterProvider } from '../src';

describe('getProvider', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should return OpenAIProvider by default', () => {
        const provider = getProvider({ apiKey: 'test-key' });
        expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('should return ClaudeProvider when requested', () => {
        const provider = getProvider({ provider: 'claude', apiKey: 'test-key' });
        expect(provider).toBeInstanceOf(ClaudeProvider);
    });

    it('should return OpenRouterProvider when requested', () => {
        const provider = getProvider({ provider: 'openrouter', apiKey: 'test-key' });
        expect(provider).toBeInstanceOf(OpenRouterProvider);
    });

    it('should throw error if apiKey is missing', () => {
        expect(() => getProvider({ provider: 'openai' })).toThrow('OpenAI API Key is not provided.');
    });
});
