import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';

export interface AIProvider {
  reviewCode(diff: string): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async reviewCode(diff: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a senior software engineer. Review the following code diff and provide concise, actionable feedback. Focus on bugs, security issues, and performance improvements.' },
        { role: 'user', content: `Review this diff:\n\n${diff}` }
      ],
    });
    return response.choices[0].message.content || 'No feedback provided.';
  }
}

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20240620') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async reviewCode(diff: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: 'You are a senior software engineer. Review the following code diff and provide concise, actionable feedback. Focus on bugs, security issues, and performance improvements.',
      messages: [
        { role: 'user', content: `Review this diff:\n\n${diff}` }
      ],
    });
    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    return 'No feedback provided.';
  }
}

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'openai/gpt-3.5-turbo') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async reviewCode(diff: string): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a senior software engineer. Review the following code diff and provide concise, actionable feedback. Focus on bugs, security issues, and performance improvements.' },
          { role: 'user', content: `Review this diff:\n\n${diff}` }
        ],
      }),
    });
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || 'No feedback provided.';
  }
}

export function getProvider(options: { provider?: string, model?: string, apiKey?: string }): AIProvider {
  const provider = options.provider || process.env.AI_PROVIDER || 'openai';
  const modelName = options.model || process.env.AI_MODEL;

  let apiKey: string | undefined = options.apiKey;
  let defaultModel: string | undefined;

  switch (provider.toLowerCase()) {
    case 'openai':
      apiKey = apiKey || process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
      defaultModel = 'gpt-4o';
      if (!apiKey) throw new Error('OpenAI API Key is not provided. Set OPENAI_API_KEY env or apiKey in config.');
      return new OpenAIProvider(apiKey, modelName || defaultModel);
    case 'claude':
    case 'anthropic':
      apiKey = apiKey || process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;
      defaultModel = 'claude-3-5-sonnet-20240620';
      if (!apiKey) throw new Error('Anthropic API Key is not provided. Set ANTHROPIC_API_KEY env or apiKey in config.');
      return new ClaudeProvider(apiKey, modelName || defaultModel);
    case 'openrouter':
      apiKey = apiKey || process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;
      defaultModel = 'openai/gpt-3.5-turbo';
      if (!apiKey) throw new Error('OpenRouter API Key is not provided. Set OPENROUTER_API_KEY env or apiKey in config.');
      return new OpenRouterProvider(apiKey, modelName || defaultModel);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
