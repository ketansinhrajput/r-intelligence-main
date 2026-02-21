/**
 * Validate Output Node
 * Checks generated content for hallucinations and compliance
 */

import type { GraphState } from "../state";
import type { ValidationResult } from "@/types/graph";
import { invokeForJSON } from "@/lib/llm/client";
import {
  buildValidateOutputPrompt,
  VALIDATE_OUTPUT_SYSTEM_PROMPT,
} from "@/lib/llm/prompts";
import { addError } from "../state";

interface ValidationResponse {
  isValid: boolean;
  hallucinationCheck: {
    passed: boolean;
    issues: Array<{
      location: string;
      type: string;
      original: string | null;
      generated: string;
      severity: "critical" | "warning" | "info";
    }>;
  };
  factualityCheck: {
    passed: boolean;
    fabricatedItems: string[];
  };
  complianceCheck: {
    passed: boolean;
    violations: string[];
  };
  summary: {
    criticalIssues: number;
    warnings: number;
    infoItems: number;
  };
  recommendation: "pass" | "fix_and_retry" | "fail";
}

/**
 * Validate generated outputs for hallucinations and compliance
 */
export async function validateOutputNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const nodeName = "validateOutput";

  try {
    if (!state.parsedResume) {
      return addError(state, nodeName, "No parsed resume available", false);
    }

    if (!state.generatedResume) {
      return addError(state, nodeName, "No generated resume available", false);
    }

    // Prepare data for validation
    const originalResume = JSON.stringify(state.parsedResume, null, 2);
    const generatedResume = JSON.stringify(state.generatedResume, null, 2);
    const generatedCoverLetter = state.generatedCoverLetter
      ? JSON.stringify(state.generatedCoverLetter, null, 2)
      : "No cover letter generated";

    const { region } = state.userOptions;

    // Build prompt and invoke LLM
    const prompt = buildValidateOutputPrompt(
      originalResume,
      generatedResume,
      generatedCoverLetter,
      region
    );

    const result = await invokeForJSON<ValidationResponse>(
      "validation",
      prompt,
      { systemPrompt: VALIDATE_OUTPUT_SYSTEM_PROMPT },
      state.llmConfig
    );

    // Convert to ValidationResult format
    // Filter out "info" severity as it's not a valid ValidationSeverity
    const validationResult: ValidationResult = {
      isValid: result.isValid,
      hallucinationCheck: {
        passed: result.hallucinationCheck?.passed ?? true,
        issues: (result.hallucinationCheck?.issues || [])
          .filter((issue) => issue.severity !== "info")
          .map((issue) => ({
            location: issue.location,
            type: issue.type as "fabricated_skill" | "fabricated_metric" | "fabricated_company" | "exaggeration",
            original: issue.original,
            generated: issue.generated,
            severity: issue.severity as "critical" | "warning",
          })),
      },
      factualityCheck: {
        passed: result.factualityCheck?.passed ?? true,
        fabricatedItems: result.factualityCheck?.fabricatedItems || [],
      },
      complianceCheck: {
        passed: result.complianceCheck?.passed ?? true,
        violations: result.complianceCheck?.violations || [],
      },
    };

    return {
      validationResult,
      currentNode: nodeName,
      completedAt: result.recommendation === "pass" ? new Date().toISOString() : null,
    };
  } catch (error) {
    console.error("validateOutput error:", error);
    return addError(
      state,
      nodeName,
      error instanceof Error ? error.message : "Failed to validate output",
      true
    );
  }
}
