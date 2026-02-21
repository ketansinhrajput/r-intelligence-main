/**
 * LangGraph Edge Conditions
 * Defines conditional routing logic for the pipeline
 */

import type { GraphState } from "./state";
import { canRetry } from "./state";

/**
 * Determine next step after fake JD detection
 */
export function shouldContinueAfterFakeDetection(
  state: GraphState
): "continue" | "warn" | "halt" {
  const jdQuality = state.jdQuality;

  if (!jdQuality) {
    return "continue"; // No quality check, proceed
  }

  // If definitely fake with high confidence, halt
  if (jdQuality.isFake && jdQuality.fakeConfidence > 0.9) {
    return "halt";
  }

  // If possibly fake, warn but continue
  if (jdQuality.isFake && jdQuality.fakeConfidence > 0.7) {
    return "warn";
  }

  // Quality issues but not fake
  if (jdQuality.qualityScore < 30) {
    return "warn";
  }

  return "continue";
}

/**
 * Determine next step after validation
 */
export function shouldRetryAfterValidation(
  state: GraphState
): "valid" | "retry" | "fail" {
  const validation = state.validationResult;

  if (!validation) {
    return "valid"; // No validation result, assume valid
  }

  // Check if valid
  if (validation.isValid) {
    return "valid";
  }

  // Check for critical issues
  const criticalIssues = validation.hallucinationCheck.issues.filter(
    (i) => i.severity === "critical"
  );

  if (criticalIssues.length > 0) {
    // Can we retry?
    if (canRetry(state, "rewriteResume", 3)) {
      return "retry";
    }
    return "fail";
  }

  // Check for compliance violations
  if (!validation.complianceCheck.passed) {
    if (canRetry(state, "rewriteResume", 3)) {
      return "retry";
    }
    return "fail";
  }

  // Warnings only - allow with caution
  const warnings = validation.hallucinationCheck.issues.filter(
    (i) => i.severity === "warning"
  );

  if (warnings.length > 2) {
    if (canRetry(state, "rewriteResume", 3)) {
      return "retry";
    }
  }

  return "valid";
}

/**
 * Check if all parsing is complete
 */
export function isParsingComplete(state: GraphState): boolean {
  return (
    state.parsedResume !== null &&
    state.parsedJd !== null
  );
}

/**
 * Check if analysis is complete
 */
export function isAnalysisComplete(state: GraphState): boolean {
  return (
    state.matchingAnalysis !== null &&
    state.atsScores !== null &&
    state.riskAnalysis !== null
  );
}

/**
 * Check if generation is complete
 */
export function isGenerationComplete(state: GraphState): boolean {
  return (
    state.generatedResume !== null &&
    state.generatedCoverLetter !== null
  );
}

/**
 * Route based on JD source type
 */
export function routeJdIngestion(
  state: GraphState
): "scrapeUrl" | "parsePdf" | "error" {
  if (state.jdSource.type === "url" && state.jdSource.url) {
    return "scrapeUrl";
  }

  if (state.jdSource.type === "pdf" && state.jdSource.pdf) {
    return "parsePdf";
  }

  return "error";
}

/**
 * Check if pipeline has errors
 */
export function hasErrors(state: GraphState): boolean {
  return state.errors.length > 0;
}

/**
 * Check if pipeline has fatal errors
 */
export function hasFatalErrors(state: GraphState): boolean {
  return state.errors.some((e) => !e.recoverable);
}

/**
 * Get next node based on current state
 */
export function getNextNode(
  state: GraphState
): string | null {
  const current = state.currentNode;

  // Check for fatal errors
  if (hasFatalErrors(state)) {
    return null;
  }

  // Define node progression
  const progression: Record<string, string | null> = {
    "__start__": "parseResume",
    "parseResume": "ingestJd",
    "parseCoverLetter": "ingestJd",
    "ingestJd": "detectFakeJd",
    "detectFakeJd": "splitMultiRole",
    "splitMultiRole": "matchResumeJd",
    "matchResumeJd": "scoreAtsConservative",
    "scoreAtsConservative": "scoreAtsAggressive",
    "scoreAtsAggressive": "analyzeRisks",
    "analyzeRisks": "rewriteResume",
    "rewriteResume": "generateCoverLetter",
    "generateCoverLetter": "validateOutput",
    "validateOutput": null,
  };

  return progression[current] || null;
}
