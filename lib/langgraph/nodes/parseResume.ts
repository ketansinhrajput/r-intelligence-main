/**
 * Parse Resume Node
 * Extracts structured data from resume PDF
 */

import type { GraphState } from "../state";
import type { ParsedResume } from "@/types/resume";
import { extractTextFromPdf, cleanExtractedText } from "@/lib/parsers/pdfParser";
import { invokeForJSON } from "@/lib/llm/client";
import {
  buildParseResumePrompt,
  PARSE_RESUME_SYSTEM_PROMPT,
} from "@/lib/llm/prompts";
import { addError } from "../state";

/**
 * Parse resume PDF and extract structured data
 */
export async function parseResumeNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const nodeName = "parseResume";
  console.log("[parseResumeNode] Starting...");

  try {
    if (!state.resumePdf) {
      console.error("[parseResumeNode] No resume PDF provided");
      return addError(state, nodeName, "No resume PDF provided", false);
    }

    console.log("[parseResumeNode] Resume PDF size:", state.resumePdf.byteLength, "bytes");

    // Extract text from PDF
    console.log("[parseResumeNode] Extracting text from PDF...");
    const pdfResult = await extractTextFromPdf(state.resumePdf);
    console.log("[parseResumeNode] PDF extraction complete, pages:", pdfResult.pageCount);
    console.log("[parseResumeNode] Raw text length:", pdfResult.text.length);

    const cleanedText = cleanExtractedText(pdfResult.text);
    console.log("[parseResumeNode] Cleaned text length:", cleanedText.length);
    console.log("[parseResumeNode] Text preview:", cleanedText.substring(0, 200));

    if (cleanedText.length < 100) {
      console.error("[parseResumeNode] Text too short:", cleanedText.length);
      return addError(
        state,
        nodeName,
        "Resume text too short - PDF may be image-based or corrupted",
        false
      );
    }

    // Build prompt and invoke LLM
    console.log("[parseResumeNode] Building prompt for LLM...");
    const prompt = buildParseResumePrompt(cleanedText);
    console.log("[parseResumeNode] Prompt length:", prompt.length);

    console.log("[parseResumeNode] Calling LLM for parsing...");
    const parsedData = await invokeForJSON<Omit<ParsedResume, "metadata" | "rawText">>(
      "parsing",
      prompt,
      { systemPrompt: PARSE_RESUME_SYSTEM_PROMPT },
      state.llmConfig
    );
    console.log("[parseResumeNode] LLM response received");
    console.log("[parseResumeNode] Contact name:", parsedData.contact?.name);
    console.log("[parseResumeNode] Experience entries:", parsedData.experience?.length || 0);
    console.log("[parseResumeNode] Skills categories:", parsedData.skills?.length || 0);

    // Construct full parsed resume
    const parsedResume: ParsedResume = {
      metadata: {
        fileName: "resume.pdf",
        pageCount: pdfResult.pageCount,
        parsedAt: new Date().toISOString(),
        confidence: 0.8, // Default confidence
      },
      contact: parsedData.contact || {
        name: "",
        email: null,
        phone: null,
        location: null,
        linkedin: null,
        github: null,
        portfolio: null,
      },
      summary: parsedData.summary || null,
      experience: parsedData.experience || [],
      education: parsedData.education || [],
      skills: parsedData.skills || [],
      certifications: parsedData.certifications || [],
      projects: parsedData.projects || [],
      awards: parsedData.awards || [],
      languages: parsedData.languages || [],
      rawText: cleanedText,
    };

    console.log("[parseResumeNode] Complete - parsed resume ready");
    return {
      parsedResume,
      currentNode: nodeName,
    };
  } catch (error) {
    console.error("[parseResumeNode] Error:", error);
    console.error("[parseResumeNode] Error stack:", error instanceof Error ? error.stack : "no stack");
    return addError(
      state,
      nodeName,
      error instanceof Error ? error.message : "Failed to parse resume",
      true
    );
  }
}
