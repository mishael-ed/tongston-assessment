import OpenAI from 'openai';
import { config } from '../config.js';

const PROMPT_VERSION = 'summary-v1';

export function mockSummary(body, { tone, length }) {
  const sentenceLimit = { short: 2, medium: 4, long: 6 }[length];
  const sentences = body.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [body];
  const summary = sentences.slice(0, sentenceLimit).join(' ').replace(/\s+/g, ' ').trim();
  const prefix = tone === 'professional' ? 'Summary:' : tone === 'friendly' ? 'In brief:' : '';
  return `${prefix} ${summary}`.trim();
}

async function withTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI provider timed out')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function openAiSummary(content, options) {
  if (!config.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  const client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: config.OPENAI_MODEL,
    instructions: `Summarize the supplied content in a ${options.tone} tone. The requested length is ${options.length}. Return only the summary.`,
    input: content.body
  });
  return response.output_text;
}

export async function summarize(content, options) {
  const task = config.AI_PROVIDER === 'openai'
    ? openAiSummary(content, options)
    : Promise.resolve(mockSummary(content.body, options));
  return withTimeout(task, config.AI_TIMEOUT_MS);
}

export function fallbackSummary(content) {
  return mockSummary(content.body, { tone: 'neutral', length: 'short' });
}

export { PROMPT_VERSION };
