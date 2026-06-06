import { OpenAIProvider, type OpenAIProviderConfig } from './openai.js';

export function createOpenAICompatProvider(config: OpenAIProviderConfig): OpenAIProvider {
  if (!config.baseUrl) {
    throw new Error('openai-compat requires a baseUrl (set baseUrl or baseUrlEnv)');
  }
  return new OpenAIProvider(config);
}
