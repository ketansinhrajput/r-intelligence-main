/**
 * Ingest Job Description Node
 * Handles both URL scraping and PDF parsing for job descriptions
 */

import type { GraphState } from "../state";
import type { ParsedJobDescription } from "@/types/jd";
import { extractTextFromPdf, cleanExtractedText } from "@/lib/parsers/pdfParser";
import { scrapeJobDescription } from "@/lib/parsers/urlScraper";
import { invokeForJSON } from "@/lib/llm/client";
import { buildParseJdPrompt, PARSE_JD_SYSTEM_PROMPT } from "@/lib/llm/prompts";
import { addError } from "../state";

/**
 * Ingest job description from URL or PDF
 */
export async function ingestJdNode(
  state: GraphState
): Promise<Partial<GraphState>> {
  const nodeName = "ingestJd";
  console.log("[ingestJdNode] Starting...");
  console.log("[ingestJdNode] JD source type:", state.jdSource.type);

  try {
    let jdText: string;
    let source: "url" | "pdf";
    let sourceUrl: string | null = null;

    if (state.jdSource.type === "url" && state.jdSource.url) {
      // Scrape from URL
      source = "url";
      sourceUrl = state.jdSource.url;
      console.log("[ingestJdNode] Scraping from URL:", sourceUrl);

      const scrapeResult = await scrapeJobDescription(state.jdSource.url);
      console.log("[ingestJdNode] Scrape result success:", scrapeResult.success);

      if (!scrapeResult.success) {
        console.error("[ingestJdNode] Scrape failed:", scrapeResult.error);
        return addError(
          state,
          nodeName,
          `Failed to scrape JD: ${scrapeResult.error}`,
          true
        );
      }

      jdText = scrapeResult.text;
      console.log("[ingestJdNode] Scraped text length:", jdText.length);
    } else if (state.jdSource.type === "pdf" && state.jdSource.pdf) {
      // Parse from PDF
      source = "pdf";
      console.log("[ingestJdNode] Parsing from PDF, size:", state.jdSource.pdf.byteLength);

      const pdfResult = await extractTextFromPdf(state.jdSource.pdf);
      jdText = cleanExtractedText(pdfResult.text);
      console.log("[ingestJdNode] Extracted text length:", jdText.length);
    } else {
      console.error("[ingestJdNode] No JD source provided");
      return addError(state, nodeName, "No JD source provided", false);
    }

    if (jdText.length < 50) {
      console.error("[ingestJdNode] JD text too short:", jdText.length);
      return addError(
        state,
        nodeName,
        "Job description text too short",
        false
      );
    }

    console.log("[ingestJdNode] JD text preview:", jdText.substring(0, 200));

    // Build prompt and invoke LLM
    console.log("[ingestJdNode] Building prompt for LLM...");
    const prompt = buildParseJdPrompt(jdText, source, sourceUrl);

    console.log("[ingestJdNode] Calling LLM for parsing...");
    const parsedData = await invokeForJSON<Omit<ParsedJobDescription, "rawText" | "qualityAssessment" | "multiRoleDetection">>(
      "parsing",
      prompt,
      { systemPrompt: PARSE_JD_SYSTEM_PROMPT },
      state.llmConfig
    );
    console.log("[ingestJdNode] LLM response received");
    console.log("[ingestJdNode] Parsed title:", parsedData.title);
    console.log("[ingestJdNode] Parsed company:", parsedData.company?.name);

    // Construct full parsed JD
    const parsedJd: ParsedJobDescription = {
      metadata: {
        source,
        sourceUrl,
        scrapedAt: new Date().toISOString(),
        company: parsedData.company?.name || "Unknown",
        confidence: parsedData.metadata?.confidence ?? 0.8,
      },
      title: parsedData.title || "Unknown Position",
      company: parsedData.company || {
        name: "Unknown",
        industry: null,
        size: null,
        description: null,
      },
      location: parsedData.location || {
        type: "not_specified",
        primary: null,
        additionalLocations: [],
        relocationOffered: null,
        visaSponsorship: null,
      },
      seniority: parsedData.seniority || {
        level: "mid",
        yearsExperienceMin: null,
        yearsExperienceMax: null,
      },
      compensation: parsedData.compensation || {
        specified: false,
        salaryMin: null,
        salaryMax: null,
        currency: null,
        type: null,
        equity: null,
        bonus: null,
      },
      requirements: parsedData.requirements || {
        required: [],
        preferred: [],
        niceToHave: [],
      },
      responsibilities: parsedData.responsibilities || [],
      benefits: parsedData.benefits || [],
      applicationDeadline: parsedData.applicationDeadline || null,
      qualityAssessment: {
        isFake: false,
        fakeConfidence: 0,
        fakeIndicators: [],
        qualityScore: 70,
        qualityIssues: [],
        redFlags: [],
      },
      multiRoleDetection: {
        isMultiRole: false,
        roles: [],
        primaryRole: parsedData.title || null,
      },
      rawText: jdText,
    };

    console.log("[ingestJdNode] Complete - parsed JD ready");
    return {
      parsedJd,
      currentNode: nodeName,
    };
  } catch (error) {
    console.error("[ingestJdNode] Error:", error);
    console.error("[ingestJdNode] Error stack:", error instanceof Error ? error.stack : "no stack");
    return addError(
      state,
      nodeName,
      error instanceof Error ? error.message : "Failed to ingest JD",
      true
    );
  }
}
