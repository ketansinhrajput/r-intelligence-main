/**
 * Resume Intelligence LangGraph Pipeline
 * Main graph definition and execution
 */

import type { GraphState } from "./state";
import type { UserOptions } from "@/types/analysis";
import type { LLMProviderConfig } from "@/stores/llmConfigStore";
import { createInitialState, incrementRetry } from "./state";
import {
  parseResumeNode,
  parseCoverLetterNode,
  ingestJdNode,
  detectFakeJdNode,
  splitMultiRoleNode,
  matchResumeJdNode,
  scoreAtsConservativeNode,
  scoreAtsAggressiveNode,
  analyzeRisksNode,
  rewriteResumeNode,
  generateCoverLetterNode,
  validateOutputNode,
} from "./nodes";
import {
  shouldContinueAfterFakeDetection,
  shouldRetryAfterValidation,
  hasFatalErrors,
} from "./edges";

/**
 * Pipeline stage definitions
 */
export const PIPELINE_STAGES = [
  { id: "parsing", name: "Parsing Documents", nodes: ["parseResume", "parseCoverLetter", "ingestJd"] },
  { id: "analysis", name: "Analyzing Content", nodes: ["detectFakeJd", "splitMultiRole"] },
  { id: "matching", name: "Matching Resume to JD", nodes: ["matchResumeJd"] },
  { id: "scoring", name: "Calculating ATS Scores", nodes: ["scoreAtsConservative", "scoreAtsAggressive"] },
  { id: "risks", name: "Analyzing Risks", nodes: ["analyzeRisks"] },
  { id: "generation", name: "Generating Outputs", nodes: ["rewriteResume", "generateCoverLetter"] },
  { id: "validation", name: "Validating Results", nodes: ["validateOutput"] },
] as const;

/**
 * Node execution map
 */
const NODE_EXECUTORS: Record<string, (state: GraphState) => Promise<Partial<GraphState>>> = {
  parseResume: parseResumeNode,
  parseCoverLetter: parseCoverLetterNode,
  ingestJd: ingestJdNode,
  detectFakeJd: detectFakeJdNode,
  splitMultiRole: splitMultiRoleNode,
  matchResumeJd: matchResumeJdNode,
  scoreAtsConservative: scoreAtsConservativeNode,
  scoreAtsAggressive: scoreAtsAggressiveNode,
  analyzeRisks: analyzeRisksNode,
  rewriteResume: rewriteResumeNode,
  generateCoverLetter: generateCoverLetterNode,
  validateOutput: validateOutputNode,
};

/**
 * Pipeline progress callback
 */
export type ProgressCallback = (
  stage: string,
  node: string,
  progress: number,
  message: string
) => void;

/**
 * Execute a single node
 */
async function executeNode(
  state: GraphState,
  nodeName: string
): Promise<GraphState> {
  const executor = NODE_EXECUTORS[nodeName];

  if (!executor) {
    throw new Error(`Unknown node: ${nodeName}`);
  }

  const updates = await executor(state);
  return { ...state, ...updates };
}

/**
 * Execute the full pipeline
 */
export async function executePipeline(
  resumePdf: ArrayBuffer,
  jdSource: { type: "url" | "pdf"; url: string | null; pdf: ArrayBuffer | null },
  userOptions: UserOptions,
  llmConfig: LLMProviderConfig,
  coverLetterPdf?: ArrayBuffer,
  onProgress?: ProgressCallback
): Promise<GraphState> {
  console.log("[executePipeline] Starting pipeline...");
  console.log("[executePipeline] Resume PDF size:", resumePdf.byteLength);
  console.log("[executePipeline] JD source type:", jdSource.type);
  console.log("[executePipeline] User options:", JSON.stringify(userOptions));
  console.log("[executePipeline] Cover letter provided:", !!coverLetterPdf);

  // Initialize state
  let state = createInitialState(resumePdf, jdSource, userOptions, llmConfig, coverLetterPdf);
  console.log("[executePipeline] Initial state created");

  const updateProgress = (stage: string, node: string, progress: number, message: string) => {
    console.log(`[executePipeline] Progress: ${stage}/${node} - ${progress}% - ${message}`);
    if (onProgress) {
      onProgress(stage, node, progress, message);
    }
  };

  try {
    // Stage 1: Parsing
    console.log("[executePipeline] === Stage 1: Parsing ===");
    updateProgress("parsing", "parseResume", 0, "Parsing resume...");
    state = await executeNode(state, "parseResume");
    console.log("[executePipeline] parseResume complete, errors:", state.errors.length);

    if (coverLetterPdf) {
      updateProgress("parsing", "parseCoverLetter", 25, "Parsing cover letter...");
      state = await executeNode(state, "parseCoverLetter");
      console.log("[executePipeline] parseCoverLetter complete");
    }

    updateProgress("parsing", "ingestJd", 50, "Ingesting job description...");
    state = await executeNode(state, "ingestJd");
    console.log("[executePipeline] ingestJd complete, parsedJd:", !!state.parsedJd);

    if (hasFatalErrors(state)) {
      console.error("[executePipeline] Fatal errors after parsing:", state.errors);
      return state;
    }

    // Stage 2: JD Analysis
    console.log("[executePipeline] === Stage 2: JD Analysis ===");
    updateProgress("analysis", "detectFakeJd", 60, "Analyzing JD authenticity...");
    state = await executeNode(state, "detectFakeJd");
    console.log("[executePipeline] detectFakeJd complete");

    const fakeDecision = shouldContinueAfterFakeDetection(state);
    console.log("[executePipeline] Fake JD decision:", fakeDecision);
    if (fakeDecision === "halt") {
      console.log("[executePipeline] Halting due to fake JD detection");
      return state;
    }

    updateProgress("analysis", "splitMultiRole", 65, "Checking for multi-role JD...");
    state = await executeNode(state, "splitMultiRole");
    console.log("[executePipeline] splitMultiRole complete");

    // Stage 3: Matching
    console.log("[executePipeline] === Stage 3: Matching ===");
    updateProgress("matching", "matchResumeJd", 70, "Matching resume to JD...");
    state = await executeNode(state, "matchResumeJd");
    console.log("[executePipeline] matchResumeJd complete, score:", state.matchingAnalysis?.overallScore);

    if (hasFatalErrors(state)) {
      console.error("[executePipeline] Fatal errors after matching:", state.errors);
      return state;
    }

    // Stage 4: Scoring
    console.log("[executePipeline] === Stage 4: Scoring ===");
    updateProgress("scoring", "scoreAtsConservative", 75, "Calculating conservative ATS score...");
    state = await executeNode(state, "scoreAtsConservative");
    console.log("[executePipeline] Conservative ATS complete, score:", state.atsScores?.conservative?.score);

    updateProgress("scoring", "scoreAtsAggressive", 80, "Calculating aggressive ATS score...");
    state = await executeNode(state, "scoreAtsAggressive");
    console.log("[executePipeline] Aggressive ATS complete, score:", state.atsScores?.aggressive?.score);

    // Stage 5: Risk Analysis
    console.log("[executePipeline] === Stage 5: Risk Analysis ===");
    updateProgress("risks", "analyzeRisks", 85, "Analyzing risks and gaps...");
    state = await executeNode(state, "analyzeRisks");
    console.log("[executePipeline] analyzeRisks complete");

    // Stage 6: Generation
    console.log("[executePipeline] === Stage 6: Generation ===");
    updateProgress("generation", "rewriteResume", 90, "Generating optimized resume...");
    state = await executeNode(state, "rewriteResume");
    console.log("[executePipeline] rewriteResume complete, hasResume:", !!state.generatedResume);

    updateProgress("generation", "generateCoverLetter", 93, "Generating cover letter...");
    state = await executeNode(state, "generateCoverLetter");
    console.log("[executePipeline] generateCoverLetter complete, hasCL:", !!state.generatedCoverLetter);

    // Stage 7: Validation with retry loop
    console.log("[executePipeline] === Stage 7: Validation ===");
    let validationAttempts = 0;
    const maxAttempts = 3;

    while (validationAttempts < maxAttempts) {
      updateProgress("validation", "validateOutput", 95, "Validating outputs...");
      state = await executeNode(state, "validateOutput");
      console.log("[executePipeline] validateOutput complete, isValid:", state.validationResult?.isValid);

      const validationDecision = shouldRetryAfterValidation(state);
      console.log("[executePipeline] Validation decision:", validationDecision);

      if (validationDecision === "valid") {
        console.log("[executePipeline] Validation passed");
        break;
      }

      if (validationDecision === "fail") {
        console.log("[executePipeline] Validation failed permanently");
        break;
      }

      // Retry
      validationAttempts++;
      console.log(`[executePipeline] Retrying validation, attempt ${validationAttempts + 1}/${maxAttempts}`);
      state = { ...state, ...incrementRetry(state, "rewriteResume") };

      updateProgress("generation", "rewriteResume", 90, `Retrying resume generation (attempt ${validationAttempts + 1})...`);
      state = await executeNode(state, "rewriteResume");

      updateProgress("generation", "generateCoverLetter", 93, "Regenerating cover letter...");
      state = await executeNode(state, "generateCoverLetter");
    }

    // Mark as complete
    state.completedAt = new Date().toISOString();
    console.log("[executePipeline] === Pipeline Complete ===");
    console.log("[executePipeline] Final state - parsedResume:", !!state.parsedResume);
    console.log("[executePipeline] Final state - parsedJd:", !!state.parsedJd);
    console.log("[executePipeline] Final state - matchingAnalysis:", !!state.matchingAnalysis);
    console.log("[executePipeline] Final state - generatedResume:", !!state.generatedResume);
    console.log("[executePipeline] Final state - errors:", state.errors.length);
    updateProgress("complete", "", 100, "Pipeline complete!");

    return state;
  } catch (error) {
    console.error("[executePipeline] Pipeline error:", error);
    console.error("[executePipeline] Error stack:", error instanceof Error ? error.stack : "no stack");
    state.errors.push({
      node: state.currentNode,
      message: error instanceof Error ? error.message : "Unknown pipeline error",
      timestamp: new Date().toISOString(),
      recoverable: false,
    });
    return state;
  }
}

/**
 * Execute pipeline with streaming updates
 */
export async function* executePipelineStream(
  resumePdf: ArrayBuffer,
  jdSource: { type: "url" | "pdf"; url: string | null; pdf: ArrayBuffer | null },
  userOptions: UserOptions,
  llmConfig: LLMProviderConfig,
  coverLetterPdf?: ArrayBuffer
): AsyncGenerator<{ state: GraphState; stage: string; progress: number; message: string }> {
  let state = createInitialState(resumePdf, jdSource, userOptions, llmConfig, coverLetterPdf);

  const stages = [
    { name: "parsing", nodes: ["parseResume", "ingestJd"] },
    { name: "analysis", nodes: ["detectFakeJd", "splitMultiRole"] },
    { name: "matching", nodes: ["matchResumeJd"] },
    { name: "scoring", nodes: ["scoreAtsConservative", "scoreAtsAggressive"] },
    { name: "risks", nodes: ["analyzeRisks"] },
    { name: "generation", nodes: ["rewriteResume", "generateCoverLetter"] },
    { name: "validation", nodes: ["validateOutput"] },
  ];

  let totalProgress = 0;
  const progressPerNode = 100 / stages.reduce((sum, s) => sum + s.nodes.length, 0);

  for (const stage of stages) {
    for (const nodeName of stage.nodes) {
      // Skip cover letter parsing if not provided
      if (nodeName === "parseCoverLetter" && !coverLetterPdf) {
        continue;
      }

      const message = `Executing ${nodeName}...`;
      yield { state, stage: stage.name, progress: totalProgress, message };

      state = await executeNode(state, nodeName);
      totalProgress += progressPerNode;

      yield { state, stage: stage.name, progress: totalProgress, message: `Completed ${nodeName}` };

      // Check for fatal errors
      if (hasFatalErrors(state)) {
        return;
      }

      // Check fake JD decision
      if (nodeName === "detectFakeJd") {
        const decision = shouldContinueAfterFakeDetection(state);
        if (decision === "halt") {
          return;
        }
      }

      // Check validation decision
      if (nodeName === "validateOutput") {
        const decision = shouldRetryAfterValidation(state);
        if (decision === "retry") {
          // Reset progress for retry
          state = { ...state, ...incrementRetry(state, "rewriteResume") };
        }
      }
    }
  }

  state.completedAt = new Date().toISOString();
  yield { state, stage: "complete", progress: 100, message: "Pipeline complete!" };
}

/**
 * Get current pipeline stage
 */
export function getCurrentStage(state: GraphState): string {
  const node = state.currentNode;

  for (const stage of PIPELINE_STAGES) {
    if (stage.nodes.includes(node as never)) {
      return stage.id;
    }
  }

  return "unknown";
}

/**
 * Calculate pipeline progress
 */
export function calculateProgress(state: GraphState): number {
  const allNodes = PIPELINE_STAGES.flatMap((s) => s.nodes);
  const currentIndex = allNodes.indexOf(state.currentNode as never);

  if (currentIndex === -1) {
    return state.completedAt ? 100 : 0;
  }

  return Math.round((currentIndex / allNodes.length) * 100);
}
