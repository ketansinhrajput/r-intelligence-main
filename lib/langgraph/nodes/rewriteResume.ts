/**
 * Rewrite Resume Node
 * Generates ATS-optimized resume while maintaining factual accuracy
 */

import type { GraphState } from "../state";
import type { GeneratedResume } from "@/types/resume";
import { invokeForJSON } from "@/lib/llm/client";
import {
  buildRewriteResumePrompt,
  REWRITE_RESUME_SYSTEM_PROMPT,
} from "@/lib/llm/prompts";
import { addError } from "../state";

/**
 * Rewrite resume for ATS optimization
 */
export async function rewriteResumeNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const nodeName = "rewriteResume";

  try {
    if (!state.parsedResume) {
      return addError(state, nodeName, "No parsed resume available", false);
    }

    if (!state.parsedJd) {
      return addError(state, nodeName, "No parsed JD available", false);
    }

    if (!state.matchingAnalysis) {
      return addError(state, nodeName, "No matching analysis available", false);
    }

    // Prepare data for rewriting
    const originalResume = JSON.stringify(state.parsedResume, null, 2);
    const jobDescription = JSON.stringify(state.parsedJd, null, 2);
    const matchingAnalysis = JSON.stringify(state.matchingAnalysis, null, 2);
    const atsScores = JSON.stringify(state.atsScores, null, 2);

    const { resumeFormat, targetAts, region } = state.userOptions;

    // Build prompt and invoke LLM
    const prompt = buildRewriteResumePrompt(
      originalResume,
      jobDescription,
      matchingAnalysis,
      atsScores,
      resumeFormat,
      targetAts,
      region
    );

    const result = await invokeForJSON<GeneratedResume>(
      "generation",
      prompt,
      { systemPrompt: REWRITE_RESUME_SYSTEM_PROMPT },
      state.llmConfig
    );

    // Ensure all required fields exist
    const generatedResume: GeneratedResume = {
      id: result.id || `resume-${Date.now()}`,
      version: result.version || 1,
      format: result.format || resumeFormat,
      content: result.content || state.parsedResume,
      changes: result.changes || [],
      complianceNotes: result.complianceNotes || [],
      atsOptimizations: result.atsOptimizations || [],
    };

    return {
      generatedResume,
      currentNode: nodeName,
    };
  } catch (error) {
    console.error("rewriteResume error:", error);
    return addError(
      state,
      nodeName,
      error instanceof Error ? error.message : "Failed to rewrite resume",
      true
    );
  }
}
