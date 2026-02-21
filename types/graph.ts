/**
 * LangGraph State and Pipeline Type Definitions
 */

import type {
  ParsedResume,
  ParsedCoverLetter,
  GeneratedResume,
  GeneratedCoverLetter,
} from "./resume";
import type {
  ParsedJobDescription,
  JdQualityAssessment,
  MultiRoleDetection,
} from "./jd";
import type {
  UserOptions,
  MatchingAnalysis,
  AtsScores,
  RiskAnalysis,
} from "./analysis";

// Enums
export type PipelineStage =
  | "idle"
  | "parsing"
  | "ingesting"
  | "detecting"
  | "splitting"
  | "matching"
  | "scoring"
  | "analyzing"
  | "rewriting"
  | "generating"
  | "validating"
  | "complete"
  | "error";

export type EdgeCondition = "continue" | "warn" | "halt" | "retry" | "valid" | "fail";
export type HallucinationType =
  | "fabricated_skill"
  | "fabricated_metric"
  | "fabricated_company"
  | "exaggeration";
export type ValidationSeverity = "critical" | "warning";

// JD Source Input
export interface JdSourceInput {
  type: "url" | "pdf";
  url: string | null;
  pdf: ArrayBuffer | null;
}

// Multi-role Analysis Result (simplified for state)
export interface MultiRoleAnalysisResult extends MultiRoleDetection {
  selectedRole: string | null;
}

// Hallucination Issue
export interface HallucinationIssue {
  location: string;
  type: HallucinationType;
  original: string | null;
  generated: string;
  severity: ValidationSeverity;
}

// Validation Checks
export interface HallucinationCheck {
  passed: boolean;
  issues: HallucinationIssue[];
}

export interface FactualityCheck {
  passed: boolean;
  fabricatedItems: string[];
}

export interface ComplianceCheck {
  passed: boolean;
  violations: string[];
}

// Validation Result
export interface ValidationResult {
  isValid: boolean;
  hallucinationCheck: HallucinationCheck;
  factualityCheck: FactualityCheck;
  complianceCheck: ComplianceCheck;
}

// Graph Error
export interface GraphError {
  node: string;
  message: string;
  timestamp: string;
  recoverable: boolean;
}

// Pipeline Progress
export interface PipelineProgress {
  stage: PipelineStage;
  progress: number;
  message: string;
  startedAt: string;
  estimatedCompletion: string | null;
}

// Node Result (generic wrapper for node outputs)
export interface NodeResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  duration: number;
}

// Graph Configuration
export interface GraphConfig {
  maxRetries: number;
  enableFakeDetection: boolean;
  enableMultiRoleSplit: boolean;
  parallelScoring: boolean;
  streamProgress: boolean;
}

// Main Graph State
export interface GraphState {
  // Input state
  resumePdf: ArrayBuffer | null;
  coverLetterPdf: ArrayBuffer | null;
  jdSource: JdSourceInput;
  userOptions: UserOptions;

  // Parsed documents
  parsedResume: ParsedResume | null;
  parsedCoverLetter: ParsedCoverLetter | null;
  parsedJd: ParsedJobDescription | null;

  // Analysis results
  jdQuality: JdQualityAssessment | null;
  multiRoleAnalysis: MultiRoleAnalysisResult | null;
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

  // Progress tracking
  progress: PipelineProgress;
}

// Factory function
export function createInitialGraphState(
  options?: Partial<GraphState>
): GraphState {
  return {
    resumePdf: null,
    coverLetterPdf: null,
    jdSource: {
      type: "pdf",
      url: null,
      pdf: null,
    },
    userOptions: {
      resumeFormat: "chronological",
      targetAts: "generic",
      region: "us",
      coverLetterLength: "medium",
    },
    parsedResume: null,
    parsedCoverLetter: null,
    parsedJd: null,
    jdQuality: null,
    multiRoleAnalysis: null,
    matchingAnalysis: null,
    atsScores: null,
    riskAnalysis: null,
    generatedResume: null,
    generatedCoverLetter: null,
    validationResult: null,
    currentNode: "start",
    errors: [],
    retryCount: {},
    startedAt: new Date().toISOString(),
    completedAt: null,
    progress: {
      stage: "idle",
      progress: 0,
      message: "Waiting to start...",
      startedAt: new Date().toISOString(),
      estimatedCompletion: null,
    },
    ...options,
  };
}

// Default graph configuration
export const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  maxRetries: 3,
  enableFakeDetection: true,
  enableMultiRoleSplit: true,
  parallelScoring: true,
  streamProgress: true,
};

// Helper functions
export function isNodeComplete(state: GraphState, nodeName: string): boolean {
  switch (nodeName) {
    case "parseResume":
      return state.parsedResume !== null;
    case "parseCoverLetter":
      return state.parsedCoverLetter !== null;
    case "ingestJd":
      return state.parsedJd !== null;
    case "detectFakeJd":
      return state.jdQuality !== null;
    case "splitMultiRole":
      return state.multiRoleAnalysis !== null;
    case "matchResumeJd":
      return state.matchingAnalysis !== null;
    case "scoreAts":
      return state.atsScores !== null;
    case "analyzeRisks":
      return state.riskAnalysis !== null;
    case "rewriteResume":
      return state.generatedResume !== null;
    case "generateCoverLetter":
      return state.generatedCoverLetter !== null;
    case "validateOutput":
      return state.validationResult !== null;
    default:
      return false;
  }
}

export function getNodeRetryCount(state: GraphState, nodeName: string): number {
  return state.retryCount[nodeName] ?? 0;
}

export function incrementRetryCount(
  state: GraphState,
  nodeName: string
): GraphState {
  return {
    ...state,
    retryCount: {
      ...state.retryCount,
      [nodeName]: (state.retryCount[nodeName] ?? 0) + 1,
    },
  };
}

export function addError(state: GraphState, error: GraphError): GraphState {
  return {
    ...state,
    errors: [...state.errors, error],
  };
}

export function updateProgress(
  state: GraphState,
  update: Partial<PipelineProgress>
): GraphState {
  return {
    ...state,
    progress: {
      ...state.progress,
      ...update,
    },
  };
}

export function getProgressPercentage(stage: PipelineStage): number {
  const stageProgress: Record<PipelineStage, number> = {
    idle: 0,
    parsing: 10,
    ingesting: 20,
    detecting: 30,
    splitting: 35,
    matching: 45,
    scoring: 55,
    analyzing: 65,
    rewriting: 75,
    generating: 85,
    validating: 95,
    complete: 100,
    error: -1,
  };
  return stageProgress[stage];
}

export function getStageMessage(stage: PipelineStage): string {
  const messages: Record<PipelineStage, string> = {
    idle: "Waiting to start...",
    parsing: "Parsing documents...",
    ingesting: "Ingesting job description...",
    detecting: "Analyzing JD quality...",
    splitting: "Detecting multiple roles...",
    matching: "Matching resume to JD...",
    scoring: "Calculating ATS scores...",
    analyzing: "Analyzing risks and gaps...",
    rewriting: "Generating optimized resume...",
    generating: "Creating cover letter...",
    validating: "Validating outputs...",
    complete: "Analysis complete!",
    error: "An error occurred",
  };
  return messages[stage];
}
