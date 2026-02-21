/**
 * Score ATS Node
 * Calculates ATS compatibility scores using different models
 */

import type { GraphState } from "../state";
import type { AtsScoreResult, AtsScores } from "@/types/analysis";
import {
  scoreResume,
  type ScoreResult,
} from "@/lib/ats/scoringModels";
import { addError } from "../state";

/**
 * Extract keywords from JD requirements
 */
function extractKeywords(parsedJd: GraphState["parsedJd"]): string[] {
  if (!parsedJd) return [];

  const keywords: string[] = [];

  // Extract from requirements
  const allRequirements = [
    ...(parsedJd.requirements.required || []),
    ...(parsedJd.requirements.preferred || []),
    ...(parsedJd.requirements.niceToHave || []),
  ];

  for (const req of allRequirements) {
    keywords.push(...(req.skills || []));
  }

  // Extract from responsibilities
  for (const resp of parsedJd.responsibilities || []) {
    // Extract potential keywords (capitalized words, technical terms)
    const matches = resp.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (matches) {
      keywords.push(...matches);
    }
  }

  // Deduplicate and filter
  return [...new Set(keywords)].filter((k) => k.length > 2);
}

/**
 * Convert ScoreResult to AtsScoreResult
 */
function toAtsScoreResult(
  result: ScoreResult,
  model: "conservative" | "aggressive"
): AtsScoreResult {
  return {
    score: result.score,
    model,
    breakdown: result.breakdown,
    passesThreshold: result.passesThreshold,
    threshold: result.threshold,
    recommendations: result.recommendations,
  };
}

/**
 * Score resume for ATS compatibility
 */
export async function scoreAtsNode(
  state: GraphState,
  model: "conservative" | "aggressive" = "conservative"
): Promise<Partial<GraphState>> {
  const nodeName = `scoreAts${model.charAt(0).toUpperCase() + model.slice(1)}`;

  try {
    if (!state.parsedResume) {
      return addError(state, nodeName, "No parsed resume available", false);
    }

    if (!state.parsedJd) {
      return addError(state, nodeName, "No parsed JD available", false);
    }

    const resumeText = state.parsedResume.rawText;
    const jdKeywords = extractKeywords(state.parsedJd);
    const jdResponsibilities = state.parsedJd.responsibilities || [];
    const requiredEducation = state.parsedJd.requirements.required.find(
      (r) => r.category === "education"
    )?.text || null;

    const atsSystem = state.userOptions.targetAts;

    // Calculate score
    const scoreResult = scoreResume(
      resumeText,
      jdKeywords,
      jdResponsibilities,
      requiredEducation,
      model,
      atsSystem
    );

    const atsScoreResult = toAtsScoreResult(scoreResult, model);

    // Get or create ATS scores object
    const existingScores = state.atsScores || {
      conservative: null as AtsScoreResult | null,
      aggressive: null as AtsScoreResult | null,
      targetSystem: null as AtsScoreResult | null,
      beforeRewrite: null as AtsScoreResult | null,
      afterRewrite: null,
      scoreChangeExplanation: null,
    };

    // Update the appropriate score
    const updatedScores: AtsScores = {
      ...existingScores,
      [model]: atsScoreResult,
      targetSystem: atsScoreResult, // Use current as target
      beforeRewrite: existingScores.beforeRewrite || atsScoreResult,
    } as AtsScores;

    return {
      atsScores: updatedScores,
      currentNode: nodeName,
    };
  } catch (error) {
    console.error(`${nodeName} error:`, error);
    return addError(
      state,
      nodeName,
      error instanceof Error ? error.message : "Failed to score ATS",
      true
    );
  }
}

/**
 * Conservative scoring node
 */
export async function scoreAtsConservativeNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  return scoreAtsNode(state, "conservative");
}

/**
 * Aggressive scoring node
 */
export async function scoreAtsAggressiveNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  return scoreAtsNode(state, "aggressive");
}
