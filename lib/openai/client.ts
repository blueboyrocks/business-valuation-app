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
      baseURL: 'https://api.openai.com/v1', // Explicitly use real OpenAI API, not Manus proxy
      timeout: 600000,
      maxRetries: 3,
      defaultHeaders: {
        'OpenAI-Beta': 'assistants=v2'
      }
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
