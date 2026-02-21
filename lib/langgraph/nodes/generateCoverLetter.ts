/**
 * Generate Cover Letter Node
 * Creates personalized, role-aligned cover letters
 */

import type { GraphState } from "../state";
import type { GeneratedCoverLetter } from "@/types/analysis";
import { invokeForJSON } from "@/lib/llm/client";
import {
  buildGenerateCoverLetterPrompt,
  GENERATE_COVER_LETTER_SYSTEM_PROMPT,
} from "@/lib/llm/prompts";
import { addError } from "../state";

/**
 * Generate personalized cover letter
 */
export async function generateCoverLetterNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const nodeName = "generateCoverLetter";

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

    // Prepare data for generation
    const resumeContent = JSON.stringify(state.parsedResume, null, 2);
    const jdContent = JSON.stringify(state.parsedJd, null, 2);
    const matchingAnalysis = JSON.stringify(state.matchingAnalysis, null, 2);

    // Extract company info
    const companyInfo = JSON.stringify({
      name: state.parsedJd.company.name,
      industry: state.parsedJd.company.industry,
      size: state.parsedJd.company.size,
      description: state.parsedJd.company.description,
      benefits: state.parsedJd.benefits,
    }, null, 2);

    const { coverLetterLength, region } = state.userOptions;

    // Build prompt and invoke LLM
    const prompt = buildGenerateCoverLetterPrompt(
      resumeContent,
      jdContent,
      companyInfo,
      matchingAnalysis,
      coverLetterLength,
      region
    );

    const result = await invokeForJSON<GeneratedCoverLetter>(
      "generation",
      prompt,
      { systemPrompt: GENERATE_COVER_LETTER_SYSTEM_PROMPT },
      state.llmConfig
    );

    // Ensure all required fields exist
    const generatedCoverLetter: GeneratedCoverLetter = {
      id: result.id || `cover-letter-${Date.now()}`,
      version: result.version || 1,
      content: result.content || "",
      paragraphs: result.paragraphs || [],
      companyPersonalization: result.companyPersonalization || [],
      roleAlignment: result.roleAlignment || [],
      wordCount: result.wordCount || result.content?.split(/\s+/).length || 0,
    };

    return {
      generatedCoverLetter,
      currentNode: nodeName,
    };
  } catch (error) {
    console.error("generateCoverLetter error:", error);
    return addError(
      state,
      nodeName,
      error instanceof Error ? error.message : "Failed to generate cover letter",
      true
    );
  }
}
