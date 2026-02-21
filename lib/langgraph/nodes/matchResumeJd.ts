/**
 * Match Resume to JD Node
 * Performs deep analysis of resume-JD alignment
 */

import type { GraphState } from "../state";
import type { MatchingAnalysis } from "@/types/analysis";
import { invokeForJSON } from "@/lib/llm/client";
import {
  buildMatchAnalysisPrompt,
  MATCH_ANALYSIS_SYSTEM_PROMPT,
} from "@/lib/llm/prompts";
import { addError } from "../state";

/**
 * Perform deep resume-JD matching analysis
 */
export async function matchResumeJdNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const nodeName = "matchResumeJd";

  try {
    if (!state.parsedResume) {
      return addError(state, nodeName, "No parsed resume available", false);
    }

    if (!state.parsedJd) {
      return addError(state, nodeName, "No parsed JD available", false);
    }

    // Prepare data for matching
    const resumeJson = JSON.stringify(state.parsedResume, null, 2);
    const jdJson = JSON.stringify(state.parsedJd, null, 2);

    // Build prompt and invoke LLM
    const prompt = buildMatchAnalysisPrompt(resumeJson, jdJson);

    const result = await invokeForJSON<MatchingAnalysis>(
      "matching",
      prompt,
      { systemPrompt: MATCH_ANALYSIS_SYSTEM_PROMPT },
      state.llmConfig
    );

    // Ensure all required fields exist
    const matchingAnalysis: MatchingAnalysis = {
      overallScore: result.overallScore ?? 0,
      explanation: result.explanation ?? "",
      skillMatch: {
        matchedSkills: result.skillMatch?.matchedSkills ?? [],
        missingSkills: result.skillMatch?.missingSkills ?? [],
        transferableSkills: result.skillMatch?.transferableSkills ?? [],
        totalRequired: result.skillMatch?.totalRequired ?? 0,
        totalMatched: result.skillMatch?.totalMatched ?? 0,
        matchPercentage: result.skillMatch?.matchPercentage ?? 0,
      },
      experienceMatch: {
        yearsRequired: result.experienceMatch?.yearsRequired ?? null,
        yearsCandidate: result.experienceMatch?.yearsCandidate ?? 0,
        matchStatus: result.experienceMatch?.matchStatus ?? "unknown",
        relevantExperiences: result.experienceMatch?.relevantExperiences ?? [],
      },
      educationMatch: {
        required: result.educationMatch?.required ?? null,
        candidate: result.educationMatch?.candidate ?? "",
        matchStatus: result.educationMatch?.matchStatus ?? "not_required",
        notes: result.educationMatch?.notes ?? null,
      },
      roleAlignment: {
        titleMatch: {
          jdTitle: result.roleAlignment?.titleMatch?.jdTitle ?? state.parsedJd.title,
          resumeTitle: result.roleAlignment?.titleMatch?.resumeTitle ??
            (state.parsedResume.experience[0]?.title ?? ""),
          alignmentScore: result.roleAlignment?.titleMatch?.alignmentScore ?? 0,
          isLateralMove: result.roleAlignment?.titleMatch?.isLateralMove ?? false,
          isPromotion: result.roleAlignment?.titleMatch?.isPromotion ?? false,
          isCareerChange: result.roleAlignment?.titleMatch?.isCareerChange ?? false,
        },
        seniorityMatch: {
          jdLevel: result.roleAlignment?.seniorityMatch?.jdLevel ??
            state.parsedJd.seniority.level,
          candidateLevel: result.roleAlignment?.seniorityMatch?.candidateLevel ?? "mid",
          matchStatus: result.roleAlignment?.seniorityMatch?.matchStatus ?? "unknown",
        },
      },
    };

    return {
      matchingAnalysis,
      currentNode: nodeName,
    };
  } catch (error) {
    console.error("matchResumeJd error:", error);
    return addError(
      state,
      nodeName,
      error instanceof Error ? error.message : "Failed to match resume to JD",
      true
    );
  }
}
