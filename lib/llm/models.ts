/**
 * Model Configuration and Task Mapping
 * Provider-agnostic — model is provided at runtime via LLM config UI
 */

export type TaskType =
  | "parsing"
  | "analysis"
  | "matching"
  | "scoring"
  | "generation"
  | "validation";

export interface ModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

/**
 * Default model — empty since model is provided at runtime via provider config
 */
const DEFAULT_MODEL = "";

/**
 * Model configurations per task type
 * Temperature, maxTokens, and timeout are task-level defaults (provider-agnostic)
 */
export const MODEL_CONFIGS: Record<TaskType, ModelConfig> = {
  parsing: {
    model: process.env.DEFAULT_PARSING_MODEL || DEFAULT_MODEL,
    temperature: 0.1,
    maxTokens: 32768,
    timeout: 60000,
  },
  analysis: {
    model: process.env.DEFAULT_ANALYSIS_MODEL || DEFAULT_MODEL,
    temperature: 0.2,
    maxTokens: 32768,
    timeout: 60000,
  },
  matching: {
    model: process.env.DEFAULT_MATCHING_MODEL || DEFAULT_MODEL,
    temperature: 0.3,
    maxTokens: 32768,
    timeout: 90000,
  },
  scoring: {
    model: process.env.DEFAULT_SCORING_MODEL || DEFAULT_MODEL,
    temperature: 0.1,
    maxTokens: 32768,
    timeout: 30000,
  },
  generation: {
    model: process.env.DEFAULT_GENERATION_MODEL || DEFAULT_MODEL,
    temperature: 0.5,
    maxTokens: 32768,
    timeout: 120000,
  },
  validation: {
    model: process.env.DEFAULT_VALIDATION_MODEL || DEFAULT_MODEL,
    temperature: 0.0,
    maxTokens: 32768,
    timeout: 60000,
  },
};

/**
 * Fallback chain for model failures (empty — single user-provided model at runtime)
 */
export const FALLBACK_CHAIN: Record<string, string[]> = {};

/**
 * Node to model mapping for LangGraph
 */
export const NODE_MODEL_MAPPING: Record<string, TaskType> = {
  parseResume: "parsing",
  parseCoverLetter: "parsing",
  ingestJd: "parsing",
  detectFakeJd: "analysis",
  splitMultiRole: "analysis",
  matchResumeJd: "matching",
  scoreAtsConservative: "scoring",
  scoreAtsAggressive: "scoring",
  analyzeRisks: "analysis",
  rewriteResume: "generation",
  generateCoverLetter: "generation",
  validateOutput: "validation",
};

/**
 * Get model configuration for a specific node
 */
export function getModelConfigForNode(nodeName: string): ModelConfig {
  const taskType = NODE_MODEL_MAPPING[nodeName];
  if (!taskType) {
    throw new Error(`Unknown node: ${nodeName}`);
  }
  return MODEL_CONFIGS[taskType];
}

/**
 * Get model configuration for a task type
 */
export function getModelConfigForTask(task: TaskType): ModelConfig {
  return MODEL_CONFIGS[task];
}

/**
 * Get model with environment override
 */
export function getModelWithOverride(task: TaskType): string {
  const envKey = `DEFAULT_${task.toUpperCase()}_MODEL`;
  return process.env[envKey] || MODEL_CONFIGS[task].model;
}
