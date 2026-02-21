/**
 * Parse Cover Letter Node
 * Extracts content from cover letter PDF
 */

import type { GraphState, ParsedCoverLetter } from "../state";
import { extractTextFromPdf, cleanExtractedText } from "@/lib/parsers/pdfParser";
import { addError } from "../state";

/**
 * Parse cover letter PDF
 */
export async function parseCoverLetterNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const nodeName = "parseCoverLetter";

  try {
    // Cover letter is optional
    if (!state.coverLetterPdf) {
      return {
        parsedCoverLetter: null,
        currentNode: nodeName,
      };
    }

    // Extract text from PDF
    const pdfResult = await extractTextFromPdf(state.coverLetterPdf);
    const cleanedText = cleanExtractedText(pdfResult.text);

    if (cleanedText.length < 50) {
      return addError(
        state,
        nodeName,
        "Cover letter text too short",
        true
      );
    }

    // Split into paragraphs
    const paragraphs = cleanedText
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0);

    // Detect tone (simple heuristic)
    const formalIndicators = [
      "sincerely",
      "regards",
      "respectfully",
      "dear",
      "position",
    ];
    const casualIndicators = ["hey", "hi!", "thanks!", "cheers"];

    const textLower = cleanedText.toLowerCase();
    const formalScore = formalIndicators.filter((w) =>
      textLower.includes(w)
    ).length;
    const casualScore = casualIndicators.filter((w) =>
      textLower.includes(w)
    ).length;

    let tone: "formal" | "casual" | "professional" = "professional";
    if (formalScore > casualScore + 1) {
      tone = "formal";
    } else if (casualScore > formalScore) {
      tone = "casual";
    }

    const parsedCoverLetter: ParsedCoverLetter = {
      metadata: {
        fileName: "cover-letter.pdf",
        pageCount: pdfResult.pageCount,
        parsedAt: new Date().toISOString(),
        confidence: 0.9,
      },
      content: cleanedText,
      paragraphs,
      tone,
      wordCount: cleanedText.split(/\s+/).length,
    };

    return {
      parsedCoverLetter,
      currentNode: nodeName,
    };
  } catch (error) {
    console.error("parseCoverLetter error:", error);
    return addError(
      state,
      nodeName,
      error instanceof Error ? error.message : "Failed to parse cover letter",
      true
    );
  }
}
