import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';

export interface AIProvider {
  reviewCode(diff: string): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4') {
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

export function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'openai';
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!apiKey) {
    throw new Error('AI_API_KEY is not set');
  }

  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(apiKey, model);
    case 'claude':
    case 'anthropic':
      return new ClaudeProvider(apiKey, model);
    case 'openrouter':
      return new OpenRouterProvider(apiKey, model);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
