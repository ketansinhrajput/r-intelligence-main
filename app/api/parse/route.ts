/**
 * Parse API Route
 * Handles PDF parsing for resumes, cover letters, and JDs
 */

import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf, cleanExtractedText } from "@/lib/parsers/pdfParser";
import { invokeForJSON } from "@/lib/llm/client";
import {
  buildParseResumePrompt,
  buildParseJdPrompt,
  PARSE_RESUME_SYSTEM_PROMPT,
  PARSE_JD_SYSTEM_PROMPT,
} from "@/lib/llm/prompts";
import type { LLMProviderConfig } from "@/stores/llmConfigStore";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as "resume" | "coverLetter" | "jd" | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: "Document type not specified" },
        { status: 400 }
      );
    }

    // Get LLM config
    const llmConfig: LLMProviderConfig = {
      baseUrl: (formData.get("llmBaseUrl") as string) || "",
      apiKey: (formData.get("llmApiKey") as string) || "",
      modelName: (formData.get("llmModelName") as string) || "",
    };

    // Validate file type
    if (!file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text from PDF
    const pdfResult = await extractTextFromPdf(arrayBuffer);
    const cleanedText = cleanExtractedText(pdfResult.text);

    if (cleanedText.length < 50) {
      return NextResponse.json(
        { error: "PDF text extraction failed - file may be image-based" },
        { status: 400 }
      );
    }

    // Parse based on document type
    let parsedData: unknown;

    if (type === "resume") {
      const prompt = buildParseResumePrompt(cleanedText);
      parsedData = await invokeForJSON(
        "parsing",
        prompt,
        { systemPrompt: PARSE_RESUME_SYSTEM_PROMPT },
        llmConfig
      );
    } else if (type === "jd") {
      const prompt = buildParseJdPrompt(cleanedText, "pdf", null);
      parsedData = await invokeForJSON(
        "parsing",
        prompt,
        { systemPrompt: PARSE_JD_SYSTEM_PROMPT },
        llmConfig
      );
    } else if (type === "coverLetter") {
      // Simple cover letter parsing
      const paragraphs = cleanedText
        .split(/\n\n+/)
        .filter((p) => p.trim().length > 0);

      parsedData = {
        content: cleanedText,
        paragraphs,
        wordCount: cleanedText.split(/\s+/).length,
      };
    }

    return NextResponse.json({
      success: true,
      type,
      data: parsedData,
      metadata: {
        fileName: file.name,
        pageCount: pdfResult.pageCount,
        parsedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Parse failed" },
      { status: 500 }
    );
  }
}
