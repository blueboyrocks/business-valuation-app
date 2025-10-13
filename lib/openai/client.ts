import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    openaiClient = new OpenAI({
      apiKey,
      timeout: 600000,
      maxRetries: 3,
    });
  }

  return openaiClient;
}

export function getAssistantId(): string {
  const assistantId = process.env.OPENAI_ASSISTANT_ID;

  if (!assistantId) {
    throw new Error('OPENAI_ASSISTANT_ID environment variable is not set');
  }

  return assistantId;
}
