/**
 * Split Multi-Role Node
 * Detects and handles job descriptions that describe multiple roles
 */

import type { GraphState } from "../state";
import type { MultiRoleDetection, DetectedRole } from "@/types/jd";
import { invokeForJSON } from "@/lib/llm/client";
import { addError } from "../state";

const SPLIT_MULTI_ROLE_PROMPT = `Analyze this job description to determine if it describes multiple distinct roles.

## Job Description
{jdText}

## Task
1. Identify if this JD describes a single role or multiple roles
2. If multiple roles, list each distinct role with:
   - Title
   - Key requirements specific to that role
   - Confidence that this is a separate role (0-1)

## Output Format
Return JSON:
{
  "isMultiRole": boolean,
  "roles": [
    {
      "title": string,
      "confidence": number,
      "matchingRequirements": string[]
    }
  ],
  "primaryRole": string | null,
  "reasoning": string
}`;

/**
 * Detect and split multi-role job descriptions
 */
export async function splitMultiRoleNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const nodeName = "splitMultiRole";

  try {
    if (!state.parsedJd) {
      return addError(state, nodeName, "No parsed JD available", false);
    }

    const jdText = state.parsedJd.rawText;
    const prompt = SPLIT_MULTI_ROLE_PROMPT.replace("{jdText}", jdText);

    const result = await invokeForJSON<{
      isMultiRole: boolean;
      roles: DetectedRole[];
      primaryRole: string | null;
      reasoning: string;
    }>("analysis", prompt, {}, state.llmConfig);

    const multiRoleAnalysis: MultiRoleDetection = {
      isMultiRole: result.isMultiRole,
      roles: result.roles || [],
      primaryRole: result.primaryRole || state.parsedJd.title,
    };

    // Update parsed JD with multi-role detection
    const updatedParsedJd = {
      ...state.parsedJd,
      multiRoleDetection: multiRoleAnalysis,
    };

    return {
      parsedJd: updatedParsedJd,
      multiRoleAnalysis,
      currentNode: nodeName,
    };
  } catch (error) {
    console.error("splitMultiRole error:", error);
    return addError(
      state,
      nodeName,
      error instanceof Error ? error.message : "Failed to analyze multi-role",
      true
    );
  }
}
