/**
 * Analyze Risks Node
 * Identifies strengths, gaps, and risks in the application
 */

import type { GraphState } from "../state";
import type { RiskAnalysis } from "@/types/analysis";
import { invokeForJSON } from "@/lib/llm/client";
import { addError } from "../state";

const ANALYZE_RISKS_PROMPT = `Analyze the candidate's application for this role and identify strengths, gaps, and risks.

## Candidate Resume
{resumeJson}

## Job Description
{jdJson}

## Matching Analysis
{matchingJson}

## Task
Provide a comprehensive risk analysis including:

1. Strengths - What makes this candidate strong for this role
2. Gaps - Missing skills or experience
3. Risks - Potential concerns a hiring manager might have

## Output Format
Return JSON:
{
  "strengths": [
    {
      "title": string,
      "description": string,
      "evidence": string,
      "impact": "high" | "medium" | "low"
    }
  ],
  "gaps": [
    {
      "title": string,
      "description": string,
      "jdRequirement": string,
      "severity": "critical" | "moderate" | "minor",
      "mitigation": string | null
    }
  ],
  "risks": [
    {
      "title": string,
      "description": string,
      "category": "experience" | "skill" | "culture" | "logistics" | "other",
      "severity": "high" | "medium" | "low",
      "recommendation": string
    }
  ],
  "overallRiskLevel": "low" | "medium" | "high"
}`;

/**
 * Analyze application risks
 */
export async function analyzeRisksNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const nodeName = "analyzeRisks";

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

    const prompt = ANALYZE_RISKS_PROMPT
      .replace("{resumeJson}", JSON.stringify(state.parsedResume, null, 2))
      .replace("{jdJson}", JSON.stringify(state.parsedJd, null, 2))
      .replace("{matchingJson}", JSON.stringify(state.matchingAnalysis, null, 2));

    const result = await invokeForJSON<RiskAnalysis>("analysis", prompt, {}, state.llmConfig);

    const riskAnalysis: RiskAnalysis = {
      strengths: result.strengths || [],
      gaps: result.gaps || [],
      risks: result.risks || [],
      overallRiskLevel: result.overallRiskLevel || "medium",
    };

    return {
      riskAnalysis,
      currentNode: nodeName,
    };
  } catch (error) {
    console.error("analyzeRisks error:", error);
    return addError(
      state,
      nodeName,
      error instanceof Error ? error.message : "Failed to analyze risks",
      true
    );
  }
}
