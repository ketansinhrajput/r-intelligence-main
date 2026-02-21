/**
 * Detect Fake JD Node
 * Analyzes job descriptions for authenticity and quality
 */

import type { GraphState } from "../state";
import type { JdQualityAssessment } from "@/types/jd";
import { invokeForJSON } from "@/lib/llm/client";
import {
  buildDetectFakeJdPrompt,
  DETECT_FAKE_JD_SYSTEM_PROMPT,
} from "@/lib/llm/prompts";
import { addError } from "../state";

interface FakeDetectionResult {
  isFake: boolean;
  fakeConfidence: number;
  fakeIndicators: string[];
  qualityScore: number;
  qualityIssues: string[];
  redFlags: string[];
  reasoning: string;
}

/**
 * Detect if JD is fake or low quality
 */
export async function detectFakeJdNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const nodeName = "detectFakeJd";

  try {
    if (!state.parsedJd) {
      return addError(state, nodeName, "No parsed JD available", false);
    }

    const jdText = state.parsedJd.rawText;
    const source = state.parsedJd.metadata.source;

    // Build prompt and invoke LLM
    const prompt = buildDetectFakeJdPrompt(jdText, source);

    const result = await invokeForJSON<FakeDetectionResult>(
      "analysis",
      prompt,
      { systemPrompt: DETECT_FAKE_JD_SYSTEM_PROMPT },
      state.llmConfig
    );

    // Update JD quality assessment
    const jdQuality: JdQualityAssessment = {
      isFake: result.isFake,
      fakeConfidence: result.fakeConfidence,
      fakeIndicators: result.fakeIndicators || [],
      qualityScore: result.qualityScore,
      qualityIssues: result.qualityIssues || [],
      redFlags: result.redFlags || [],
    };

    // Update parsed JD with quality assessment
    const updatedParsedJd = {
      ...state.parsedJd,
      qualityAssessment: jdQuality,
    };

    return {
      parsedJd: updatedParsedJd,
      jdQuality,
      currentNode: nodeName,
    };
  } catch (error) {
    console.error("detectFakeJd error:", error);
    return addError(
      state,
      nodeName,
      error instanceof Error ? error.message : "Failed to detect fake JD",
      true
    );
  }
}
