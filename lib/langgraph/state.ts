/**
 * LangGraph State Definition
 * Defines the state schema for the resume intelligence pipeline
 */

import type { ParsedResume, GeneratedResume } from "@/types/resume";
import type {
  ParsedJobDescription,
  JdQualityAssessment,
  MultiRoleDetection,
} from "@/types/jd";
import type {
  MatchingAnalysis,
  AtsScores,
  RiskAnalysis,
  GeneratedCoverLetter,
  UserOptions,
} from "@/types/analysis";
import type { ValidationResult, GraphError } from "@/types/graph";
import type { LLMProviderConfig } from "@/stores/llmConfigStore";

/**
 * Parsed cover letter structure
 */
export interface ParsedCoverLetter {
  metadata: {
    fileName: string;
    pageCount: number;
    parsedAt: string;
    confidence: number;
  };
  content: string;
  paragraphs: string[];
  tone: "formal" | "casual" | "professional";
  wordCount: number;
}

/**
 * Main graph state interface
 */
export interface GraphState {
  // Input state
  resumePdf: ArrayBuffer | null;
  coverLetterPdf: ArrayBuffer | null;
  jdSource: {
    type: "url" | "pdf";
    url: string | null;
    pdf: ArrayBuffer | null;
  };
  userOptions: UserOptions;
  llmConfig: LLMProviderConfig;

  // Parsed documents
  parsedResume: ParsedResume | null;
  parsedCoverLetter: ParsedCoverLetter | null;
  parsedJd: ParsedJobDescription | null;

  // Analysis results
  jdQuality: JdQualityAssessment | null;
  multiRoleAnalysis: MultiRoleDetection | null;
  matchingAnalysis: MatchingAnalysis | null;
  atsScores: AtsScores | null;
  riskAnalysis: RiskAnalysis | null;

  // Generated outputs
  generatedResume: GeneratedResume | null;
  generatedCoverLetter: GeneratedCoverLetter | null;

  // Validation
  validationResult: ValidationResult | null;

  // Pipeline metadata
  currentNode: string;
  errors: GraphError[];
  retryCount: Record<string, number>;
  startedAt: string;
  completedAt: string | null;
}

/**
 * Create initial graph state
 */
export function createInitialState(
  resumePdf: ArrayBuffer,
  jdSource: { type: "url" | "pdf"; url: string | null; pdf: ArrayBuffer | null },
  userOptions: UserOptions,
  llmConfig: LLMProviderConfig,
  coverLetterPdf?: ArrayBuffer
): GraphState {
  return {
    // Inputs
    resumePdf,
    coverLetterPdf: coverLetterPdf || null,
    jdSource,
    userOptions,
    llmConfig,

    // Parsed documents
    parsedResume: null,
    parsedCoverLetter: null,
    parsedJd: null,

    // Analysis
    jdQuality: null,
    multiRoleAnalysis: null,
    matchingAnalysis: null,
    atsScores: null,
    riskAnalysis: null,

    // Generated
    generatedResume: null,
    generatedCoverLetter: null,

    // Validation
    validationResult: null,

    // Metadata
    currentNode: "__start__",
    errors: [],
    retryCount: {},
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

/**
 * State channel annotations for LangGraph
 */
export const stateChannels = {
  resumePdf: {
    value: (old: ArrayBuffer | null, next: ArrayBuffer | null) => next ?? old,
    default: () => null,
  },
  coverLetterPdf: {
    value: (old: ArrayBuffer | null, next: ArrayBuffer | null) => next ?? old,
    default: () => null,
  },
  jdSource: {
    value: (
      old: GraphState["jdSource"],
      next: GraphState["jdSource"]
    ) => next ?? old,
    default: () => ({ type: "url" as const, url: null, pdf: null }),
  },
  userOptions: {
    value: (old: UserOptions, next: UserOptions) => next ?? old,
    default: () => ({
      resumeFormat: "chronological" as const,
      targetAts: "generic" as const,
      region: "us" as const,
      coverLetterLength: "medium" as const,
    }),
  },
  llmConfig: {
    value: (old: LLMProviderConfig, next: LLMProviderConfig) => next ?? old,
    default: () => ({ baseUrl: "", apiKey: "", modelName: "" }),
  },
  parsedResume: {
    value: (old: ParsedResume | null, next: ParsedResume | null) => next ?? old,
    default: () => null,
  },
  parsedCoverLetter: {
    value: (old: ParsedCoverLetter | null, next: ParsedCoverLetter | null) =>
      next ?? old,
    default: () => null,
  },
  parsedJd: {
    value: (old: ParsedJobDescription | null, next: ParsedJobDescription | null) =>
      next ?? old,
    default: () => null,
  },
  jdQuality: {
    value: (old: JdQualityAssessment | null, next: JdQualityAssessment | null) =>
      next ?? old,
    default: () => null,
  },
  multiRoleAnalysis: {
    value: (old: MultiRoleDetection | null, next: MultiRoleDetection | null) =>
      next ?? old,
    default: () => null,
  },
  matchingAnalysis: {
    value: (old: MatchingAnalysis | null, next: MatchingAnalysis | null) =>
      next ?? old,
    default: () => null,
  },
  atsScores: {
    value: (old: AtsScores | null, next: AtsScores | null) => next ?? old,
    default: () => null,
  },
  riskAnalysis: {
    value: (old: RiskAnalysis | null, next: RiskAnalysis | null) => next ?? old,
    default: () => null,
  },
  generatedResume: {
    value: (old: GeneratedResume | null, next: GeneratedResume | null) =>
      next ?? old,
    default: () => null,
  },
  generatedCoverLetter: {
    value: (old: GeneratedCoverLetter | null, next: GeneratedCoverLetter | null) =>
      next ?? old,
    default: () => null,
  },
  validationResult: {
    value: (old: ValidationResult | null, next: ValidationResult | null) =>
      next ?? old,
    default: () => null,
  },
  currentNode: {
    value: (old: string, next: string) => next ?? old,
    default: () => "__start__",
  },
  errors: {
    value: (old: GraphError[], next: GraphError[]) => [...old, ...next],
    default: () => [] as GraphError[],
  },
  retryCount: {
    value: (
      old: Record<string, number>,
      next: Record<string, number>
    ) => ({ ...old, ...next }),
    default: () => ({} as Record<string, number>),
  },
  startedAt: {
    value: (old: string, next: string) => old,
    default: () => new Date().toISOString(),
  },
  completedAt: {
    value: (old: string | null, next: string | null) => next ?? old,
    default: () => null,
  },
};

/**
 * Helper to add error to state
 */
export function addError(
  state: GraphState,
  node: string,
  message: string,
  recoverable: boolean = true
): Partial<GraphState> {
  const error: GraphError = {
    node,
    message,
    timestamp: new Date().toISOString(),
    recoverable,
  };
  return {
    errors: [...state.errors, error],
  };
}

/**
 * Helper to increment retry count
 */
export function incrementRetry(
  state: GraphState,
  node: string
): Partial<GraphState> {
  const current = state.retryCount[node] || 0;
  return {
    retryCount: { ...state.retryCount, [node]: current + 1 },
  };
}

/**
 * Check if node can retry
 */
export function canRetry(state: GraphState, node: string, maxRetries: number = 3): boolean {
  return (state.retryCount[node] || 0) < maxRetries;
}
