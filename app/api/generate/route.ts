/**
 * Generate API Route
 * Handles resume rewriting and cover letter generation
 */

import { NextRequest, NextResponse } from "next/server";
import { invokeForJSON } from "@/lib/llm/client";
import type { LLMProviderConfig } from "@/stores/llmConfigStore";
import {
  buildRewriteResumePrompt,
  buildGenerateCoverLetterPrompt,
  REWRITE_RESUME_SYSTEM_PROMPT,
  GENERATE_COVER_LETTER_SYSTEM_PROMPT,
} from "@/lib/llm/prompts";
import type { GeneratedResume } from "@/types/resume";
import type { GeneratedCoverLetter, UserOptions } from "@/types/analysis";

export const maxDuration = 180; // 3 minutes

interface GenerateRequest {
  type: "resume" | "coverLetter" | "both";
  originalResume: unknown;
  parsedJd: unknown;
  matchingAnalysis: unknown;
  atsScores?: unknown;
  options: UserOptions;
  llmBaseUrl?: string;
  llmApiKey?: string;
  llmModelName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    const {
      type,
      originalResume,
      parsedJd,
      matchingAnalysis,
      atsScores,
      options,
      llmBaseUrl,
      llmApiKey,
      llmModelName,
    } = body;

    const llmConfig: LLMProviderConfig = {
      baseUrl: llmBaseUrl || "",
      apiKey: llmApiKey || "",
      modelName: llmModelName || "",
    };

    // Validate required fields
    if (!originalResume) {
      return NextResponse.json(
        { error: "Original resume is required" },
        { status: 400 }
      );
    }

    if (!parsedJd) {
      return NextResponse.json(
        { error: "Parsed JD is required" },
        { status: 400 }
      );
    }

    if (!matchingAnalysis) {
      return NextResponse.json(
        { error: "Matching analysis is required" },
        { status: 400 }
      );
    }

    const results: {
      generatedResume?: GeneratedResume;
      generatedCoverLetter?: GeneratedCoverLetter;
    } = {};

    // Generate resume if requested
    if (type === "resume" || type === "both") {
      const resumePrompt = buildRewriteResumePrompt(
        JSON.stringify(originalResume, null, 2),
        JSON.stringify(parsedJd, null, 2),
        JSON.stringify(matchingAnalysis, null, 2),
        JSON.stringify(atsScores || {}, null, 2),
        options.resumeFormat,
        options.targetAts,
        options.region
      );

      const generatedResume = await invokeForJSON<GeneratedResume>(
        "generation",
        resumePrompt,
        { systemPrompt: REWRITE_RESUME_SYSTEM_PROMPT },
        llmConfig
      );

      results.generatedResume = {
        id: generatedResume.id || `resume-${Date.now()}`,
        version: generatedResume.version || 1,
        format: generatedResume.format || options.resumeFormat,
        content: generatedResume.content,
        changes: generatedResume.changes || [],
        complianceNotes: generatedResume.complianceNotes || [],
        atsOptimizations: generatedResume.atsOptimizations || [],
      };
    }

    // Generate cover letter if requested
    if (type === "coverLetter" || type === "both") {
      // Extract company info from JD
      const jd = parsedJd as { company?: { name?: string; industry?: string; size?: string; description?: string }; benefits?: string[] };
      const companyInfo = JSON.stringify({
        name: jd.company?.name || "Unknown",
        industry: jd.company?.industry,
        size: jd.company?.size,
        description: jd.company?.description,
        benefits: jd.benefits || [],
      }, null, 2);

      const coverLetterPrompt = buildGenerateCoverLetterPrompt(
        JSON.stringify(originalResume, null, 2),
        JSON.stringify(parsedJd, null, 2),
        companyInfo,
        JSON.stringify(matchingAnalysis, null, 2),
        options.coverLetterLength,
        options.region
      );

      const generatedCoverLetter = await invokeForJSON<GeneratedCoverLetter>(
        "generation",
        coverLetterPrompt,
        { systemPrompt: GENERATE_COVER_LETTER_SYSTEM_PROMPT },
        llmConfig
      );

      results.generatedCoverLetter = {
        id: generatedCoverLetter.id || `cover-letter-${Date.now()}`,
        version: generatedCoverLetter.version || 1,
        content: generatedCoverLetter.content || "",
        paragraphs: generatedCoverLetter.paragraphs || [],
        companyPersonalization: generatedCoverLetter.companyPersonalization || [],
        roleAlignment: generatedCoverLetter.roleAlignment || [],
        wordCount: generatedCoverLetter.wordCount ||
          (generatedCoverLetter.content?.split(/\s+/).length || 0),
      };
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
