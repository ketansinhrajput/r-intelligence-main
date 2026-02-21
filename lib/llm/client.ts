/**
 * Provider-Agnostic LLM Client
 * Uses OpenAI SDK with configurable baseURL to support any OpenAI-compatible endpoint
 * (OpenAI, Anthropic, Google Gemini, Ollama, etc.)
 */

import OpenAI from "openai";
import { MODEL_CONFIGS, type TaskType } from "./models";
import { getMockResponse } from "./mockResponses";
import type { LLMProviderConfig } from "@/stores/llmConfigStore";

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  systemPrompt?: string;
}

const USE_MOCK = process.env.USE_MOCK_LLM === "true";

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000;

// Client cache keyed by baseUrl+apiKey
const clientCache = new Map<string, OpenAI>();

/**
 * Get or create an OpenAI client for the given provider config
 */
function getClient(providerConfig: LLMProviderConfig): OpenAI {
  const cacheKey = `${providerConfig.baseUrl}::${providerConfig.apiKey}`;
  let client = clientCache.get(cacheKey);
  if (!client) {
    client = new OpenAI({
      baseURL: providerConfig.baseUrl,
      apiKey: providerConfig.apiKey,
    });
    clientCache.set(cacheKey, client);
  }
  return client;
}

/**
 * Check if an error is a rate limit (429) error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    return error.status === 429;
  }
  if (error instanceof Error) {
    return error.message.includes("429") || error.message.includes("Too Many Requests");
  }
  return false;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Invoke a model with the given prompt using OpenAI-compatible API
 */
export async function invokeModel(
  model: string,
  prompt: string,
  options: LLMOptions = {},
  providerConfig: LLMProviderConfig
): Promise<LLMResponse> {
  const {
    temperature = 0.3,
    maxTokens = 4096,
    systemPrompt,
  } = options;

  const client = getClient(providerConfig);

  console.log(`[invokeModel] Calling model: ${model}`);
  console.log(`[invokeModel] Prompt length: ${prompt.length}`);
  console.log(`[invokeModel] Max tokens: ${maxTokens}`);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      });

      const choice = completion.choices[0];
      const finishReason = choice?.finish_reason || "stop";

      // Ollama reasoning models (GLM, DeepSeek-R1, etc.) may put chain-of-thought
      // in message.thinking instead of message.content
      const message = choice?.message as Record<string, unknown> | undefined;
      const rawContent = (message?.content as string) || "";
      const thinking = (message?.thinking as string) || "";
      const content = rawContent || thinking;

      console.log(`[invokeModel] Response received from ${model}`);
      console.log(`[invokeModel] Finish reason: ${finishReason}`);
      console.log(`[invokeModel] Content length: ${rawContent.length}`);
      if (thinking) {
        console.log(`[invokeModel] Thinking field length: ${thinking.length}`);
        if (!rawContent) {
          console.log(`[invokeModel] Using thinking field as content fallback`);
        }
      }

      if (finishReason === "length") {
        console.warn(`[invokeModel] WARNING: Response was truncated (hit token limit)`);
      }

      if (!content) {
        console.error(`[invokeModel] WARNING: Empty content from model!`);
        if (message) {
          console.error(`[invokeModel] Message keys: ${Object.keys(message).join(", ")}`);
        }
      }

      const usage = completion.usage;
      console.log(`[invokeModel] Usage - prompt: ${usage?.prompt_tokens}, completion: ${usage?.completion_tokens}, total: ${usage?.total_tokens}`);

      return {
        content,
        model,
        usage: {
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
        finishReason: finishReason === "length" ? "length" : "stop",
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[invokeModel] Error with model ${model} (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);

      if (isRateLimitError(error) && attempt < MAX_RETRIES - 1) {
        const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt);
        console.log(`[invokeModel] Rate limited. Retrying in ${delayMs}ms...`);
        await sleep(delayMs);
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error(`All ${MAX_RETRIES} attempts failed for model: ${model}`);
}

/**
 * Invoke with task-level defaults (temperature, maxTokens, timeout)
 */
export async function invokeWithFallback(
  task: TaskType,
  prompt: string,
  options: LLMOptions = {},
  providerConfig: LLMProviderConfig
): Promise<LLMResponse> {
  console.log(`[invokeWithFallback] Task: ${task}, USE_MOCK: ${USE_MOCK}`);

  // Use mock mode if enabled
  if (USE_MOCK) {
    console.log(`[invokeWithFallback] Using mock response for task: ${task}`);
    const mockContent = getMockResponse(task, prompt);
    return {
      content: mockContent,
      model: "mock",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: "stop",
    };
  }

  const config = MODEL_CONFIGS[task];

  const mergedOptions: LLMOptions = {
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    timeout: config.timeout,
    ...options,
  };

  // Use the model from provider config (runtime), falling back to task config default
  const model = providerConfig.modelName || config.model;

  return await invokeModel(model, prompt, mergedOptions, providerConfig);
}

/**
 * Stream response from model (for real-time progress)
 */
export async function* streamModel(
  model: string,
  prompt: string,
  options: LLMOptions = {},
  providerConfig: LLMProviderConfig
): AsyncGenerator<string, void, unknown> {
  const {
    temperature = 0.3,
    maxTokens = 4096,
    systemPrompt,
  } = options;

  const client = getClient(providerConfig);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const stream = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) {
      yield text;
    }
  }
}

/**
 * Stream with task-level defaults
 */
export async function* streamWithFallback(
  task: TaskType,
  prompt: string,
  options: LLMOptions = {},
  providerConfig: LLMProviderConfig
): AsyncGenerator<string, void, unknown> {
  const config = MODEL_CONFIGS[task];
  const model = providerConfig.modelName || config.model;

  const mergedOptions: LLMOptions = {
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    ...options,
  };

  yield* streamModel(model, prompt, mergedOptions, providerConfig);
}

/**
 * Invoke and parse JSON response
 */
export async function invokeForJSON<T>(
  task: TaskType,
  prompt: string,
  options: LLMOptions = {},
  providerConfig: LLMProviderConfig
): Promise<T> {
  const response = await invokeWithFallback(task, prompt, {
    ...options,
    temperature: 0.1, // Lower temperature for JSON
  }, providerConfig);

  // Log raw response for debugging
  console.log("[invokeForJSON] Raw response length:", response.content.length);
  console.log("[invokeForJSON] Raw response preview:", response.content.substring(0, 500));

  // Check for empty response
  if (!response.content || response.content.trim().length === 0) {
    console.error("[invokeForJSON] Empty response from model");
    throw new Error("Empty response from model - the model may need more context or a simpler prompt");
  }

  // Extract JSON from response
  let content = response.content.trim();

  // Try parsing directly first (response_format: json_object should return valid JSON)
  try {
    return JSON.parse(content) as T;
  } catch {
    console.log("[invokeForJSON] Direct parse failed, attempting extraction");
  }

  // Handle markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    console.log("[invokeForJSON] Found JSON in code block");
    content = jsonMatch[1]?.trim() || content;
  }

  // Try to find JSON object or array
  const startBrace = content.indexOf("{");
  const startBracket = content.indexOf("[");

  if (startBrace === -1 && startBracket === -1) {
    console.error("[invokeForJSON] No JSON found in response:", content.substring(0, 200));
    throw new Error("No JSON object or array found in model response");
  }

  const start = startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)
    ? startBrace
    : startBracket;

  const isArray = content[start] === "[";
  const endChar = isArray ? "]" : "}";

  let depth = 0;
  let end = start;

  for (let i = start; i < content.length; i++) {
    if (content[i] === (isArray ? "[" : "{")) depth++;
    if (content[i] === endChar) depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }

  if (depth !== 0) {
    console.error("[invokeForJSON] Incomplete JSON - depth:", depth);
    console.error("[invokeForJSON] Content length:", content.length);
    console.error("[invokeForJSON] Content tail:", content.substring(content.length - 200));
    throw new Error(`Incomplete JSON response from model (unclosed brackets: ${depth}). Try increasing maxTokens or simplifying the prompt.`);
  }

  content = content.slice(start, end);
  console.log("[invokeForJSON] Extracted JSON length:", content.length);

  try {
    return JSON.parse(content) as T;
  } catch (parseError) {
    console.error("[invokeForJSON] Failed to parse JSON:", content.substring(0, 500));
    console.error("[invokeForJSON] JSON tail:", content.substring(content.length - 200));
    throw new Error(`Invalid JSON response from model: ${parseError}`);
  }
}
