import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { createOllama } from 'ollama-ai-provider';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import {
  isAnthropicProvider,
  isBedrockProvider,
  isDeepseekProvider,
  isGeminiProvider,
  isOllamaProvider,
  isOpenAiCompatibleProvider,
  isOpenAiProvider,
  LlmProvider,
} from '@common/llm-providers';

import type { LanguageModel } from 'ai';

export const createLlm = (provider: LlmProvider, env: Record<string, string | undefined> = {}): LanguageModel => {
  if (isAnthropicProvider(provider)) {
    const apiKey = provider.apiKey || env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      throw new Error('Anthropic API key is required in Agent provider settings or Aider environment variables (ANTHROPIC_API_KEY)');
    }
    const anthropicProvider = createAnthropic({ apiKey });
    return anthropicProvider(provider.model);
  } else if (isOpenAiProvider(provider)) {
    const apiKey = provider.apiKey || env['OPENAI_API_KEY'];
    if (!apiKey) {
      throw new Error('OpenAI API key is required in Agent provider settings or Aider environment variables (OPENAI_API_KEY)');
    }
    const openAIProvider = createOpenAI({
      apiKey,
      compatibility: 'strict',
    });
    return openAIProvider(provider.model, {
      structuredOutputs: false,
    });
  } else if (isGeminiProvider(provider)) {
    const apiKey = provider.apiKey || env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new Error('Gemini API key is required in Agent provider settings or Aider environment variables (GEMINI_API_KEY)');
    }
    const googleProvider = createGoogleGenerativeAI({ apiKey });
    return googleProvider(provider.model);
  } else if (isDeepseekProvider(provider)) {
    const apiKey = provider.apiKey || env['DEEPSEEK_API_KEY'];
    if (!apiKey) {
      throw new Error('Deepseek API key is required in Agent provider settings or Aider environment variables (DEEPSEEK_API_KEY)');
    }
    const deepseekProvider = createDeepSeek({ apiKey });
    return deepseekProvider(provider.model);
  } else if (isOpenAiCompatibleProvider(provider)) {
    const apiKey = provider.apiKey || env['OPENAI_API_KEY'];
    if (!apiKey) {
      throw new Error(`API key is required for ${provider.name}. Check Agent provider settings or Aider environment variables (OPENAI_API_KEY).`);
    }
    const baseUrl = provider.baseUrl || env['OPENAI_API_BASE'];
    if (!baseUrl) {
      throw new Error(`Base URL is required for ${provider.name} provider. Set it in Agent provider settings or via the OPENAI_API_BASE environment variable.`);
    }
    const model = provider.model;
    if (!model) {
      throw new Error(`Model name is required for ${provider.name} provider`);
    }
    // Use createOpenAICompatible to get a provider instance, then get the model
    const compatibleProvider = createOpenAICompatible({
      name: provider.name,
      apiKey,
      baseURL: baseUrl,
    });
    return compatibleProvider(provider.model);
  } else if (isBedrockProvider(provider)) {
    const region = provider.region || env['AWS_REGION'];
    const accessKeyId = provider.accessKeyId || env['AWS_ACCESS_KEY_ID'];
    const secretAccessKey = provider.secretAccessKey || env['AWS_SECRET_ACCESS_KEY'];

    if (!region) {
      throw new Error('AWS region is required for Bedrock. You can set it in the MCP settings or Aider environment variables (AWS_REGION).');
    }
    // Check if we have explicit keys or if AWS_PROFILE is set in the main process env
    if (!accessKeyId && !secretAccessKey && !process.env.AWS_PROFILE) {
      throw new Error(
        'AWS credentials (accessKeyId/secretAccessKey) or AWS_PROFILE must be provided for Bedrock in Agent provider settings or Aider environment variables.',
      );
    }

    // AI SDK Bedrock provider handles credentials via environment variables or default chain.
    // We pass credentials explicitly only if they were found in config or env.
    // Otherwise, we let the SDK handle the default credential chain (which includes AWS_PROFILE from process.env).
    const bedrockProviderInstance = createAmazonBedrock({
      region,
      ...(accessKeyId &&
        secretAccessKey && {
          accessKeyId,
          secretAccessKey,
        }),
      // Let the SDK handle the default chain if explicit keys aren't provided
      credentialProvider: !accessKeyId && !secretAccessKey ? fromNodeProviderChain() : undefined,
    });
    return bedrockProviderInstance(provider.model);
  } else if (isOllamaProvider(provider)) {
    const baseUrl = provider.baseUrl || env['OLLAMA_API_BASE'];
    if (!baseUrl) {
      throw new Error('Base URL is required for Ollama provider. Set it in Agent provider settings or via the OLLAMA_API_BASE environment variable.');
    }
    if (!provider.model) {
      throw new Error('Model name is required for Ollama provider');
    }
    // Ensure the baseUrl ends with /api for ollama-ai-provider
    const finalBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const ollamaInstance = createOllama({ baseURL: finalBaseUrl });
    return ollamaInstance(provider.model, {
      simulateStreaming: true,
    });
  } else {
    throw new Error(`Unsupported MCP provider: ${JSON.stringify(provider)}`);
  }
};
