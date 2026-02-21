/**
 * Scrape API Route
 * Handles job description URL scraping
 */

import { NextRequest, NextResponse } from "next/server";
import {
  scrapeJobDescription,
  isJobPostingUrl,
} from "@/lib/parsers/urlScraper";
import { invokeForJSON } from "@/lib/llm/client";
import { buildParseJdPrompt, PARSE_JD_SYSTEM_PROMPT } from "@/lib/llm/prompts";
import type { LLMProviderConfig } from "@/stores/llmConfigStore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, llmBaseUrl, llmApiKey, llmModelName } = body;

    const llmConfig: LLMProviderConfig = {
      baseUrl: llmBaseUrl || "",
      apiKey: llmApiKey || "",
      modelName: llmModelName || "",
    };

    if (!url) {
      return NextResponse.json(
        { error: "No URL provided" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Check if it's a job posting URL
    if (!isJobPostingUrl(url)) {
      return NextResponse.json(
        {
          warning: "URL may not be a job posting",
          suggestion: "Make sure the URL points to a specific job listing",
        },
        { status: 200 }
      );
    }

    // Scrape the job description
    const scrapeResult = await scrapeJobDescription(url);

    if (!scrapeResult.success) {
      return NextResponse.json(
        { error: scrapeResult.error || "Failed to scrape job description" },
        { status: 400 }
      );
    }

    // Parse the scraped content
    const prompt = buildParseJdPrompt(scrapeResult.text, "url", url);
    const parsedJd = await invokeForJSON<Record<string, unknown>>(
      "parsing",
      prompt,
      { systemPrompt: PARSE_JD_SYSTEM_PROMPT },
      llmConfig
    );

    return NextResponse.json({
      success: true,
      data: {
        ...(parsedJd as object),
        metadata: {
          source: "url",
          sourceUrl: url,
          scrapedAt: new Date().toISOString(),
          scraperSource: scrapeResult.source,
        },
        scraped: {
          title: scrapeResult.title,
          company: scrapeResult.company,
          location: scrapeResult.location,
        },
      },
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scrape failed" },
      { status: 500 }
    );
  }
}
