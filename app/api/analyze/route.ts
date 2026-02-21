/**
 * Analyze API Route
 * Runs the full analysis pipeline with streaming progress
 */

import { NextRequest } from "next/server";
import { executePipeline } from "@/lib/langgraph/graph";
import type { UserOptions } from "@/types/analysis";
import type { LLMProviderConfig } from "@/stores/llmConfigStore";

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  console.log("[API /analyze] Request received");

  try {
    const formData = await request.formData();
    console.log("[API /analyze] FormData parsed");

    // Get files
    const resumeFile = formData.get("resume") as File | null;
    const coverLetterFile = formData.get("coverLetter") as File | null;
    const jdFile = formData.get("jd") as File | null;
    const jdUrl = formData.get("jdUrl") as string | null;

    console.log("[API /analyze] Resume file:", resumeFile?.name, resumeFile?.size);
    console.log("[API /analyze] Cover letter:", coverLetterFile?.name);
    console.log("[API /analyze] JD file:", jdFile?.name);
    console.log("[API /analyze] JD URL:", jdUrl);

    // Get options
    const options: UserOptions = {
      resumeFormat: (formData.get("resumeFormat") as UserOptions["resumeFormat"]) || "chronological",
      targetAts: (formData.get("targetAts") as UserOptions["targetAts"]) || "generic",
      region: (formData.get("region") as UserOptions["region"]) || "us",
      coverLetterLength: (formData.get("coverLetterLength") as UserOptions["coverLetterLength"]) || "medium",
    };
    console.log("[API /analyze] Options:", options);

    // Get LLM config
    const llmConfig: LLMProviderConfig = {
      baseUrl: (formData.get("llmBaseUrl") as string) || "",
      apiKey: (formData.get("llmApiKey") as string) || "",
      modelName: (formData.get("llmModelName") as string) || "",
    };
    console.log("[API /analyze] LLM config - baseUrl:", llmConfig.baseUrl, "model:", llmConfig.modelName);

    // Validate inputs
    if (!resumeFile) {
      console.error("[API /analyze] No resume file");
      return new Response(
        JSON.stringify({ error: "Resume file is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!jdFile && !jdUrl) {
      console.error("[API /analyze] No JD source");
      return new Response(
        JSON.stringify({ error: "Job description (file or URL) is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Read files
    console.log("[API /analyze] Reading resume file...");
    const resumePdf = await resumeFile.arrayBuffer();
    console.log("[API /analyze] Resume buffer size:", resumePdf.byteLength);

    const coverLetterPdf = coverLetterFile
      ? await coverLetterFile.arrayBuffer()
      : undefined;
    console.log("[API /analyze] Cover letter buffer size:", coverLetterPdf?.byteLength);

    // Determine JD source
    let jdSource: {
      type: "url" | "pdf";
      url: string | null;
      pdf: ArrayBuffer | null;
    };

    if (jdUrl) {
      console.log("[API /analyze] Using JD URL:", jdUrl);
      jdSource = { type: "url", url: jdUrl, pdf: null };
    } else if (jdFile) {
      console.log("[API /analyze] Reading JD file...");
      const jdPdf = await jdFile.arrayBuffer();
      console.log("[API /analyze] JD buffer size:", jdPdf.byteLength);
      jdSource = { type: "pdf", url: null, pdf: jdPdf };
    } else {
      return new Response(
        JSON.stringify({ error: "No JD source provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create streaming response
    console.log("[API /analyze] Creating streaming response...");
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          const json = JSON.stringify(data);
          console.log("[API /analyze] Sending event:", data.stage, data.progress);
          controller.enqueue(encoder.encode(`data: ${json}\n\n`));
        };

        try {
          console.log("[API /analyze] Starting pipeline execution...");

          // Run the pipeline with progress callback
          const finalState = await executePipeline(
            resumePdf,
            jdSource,
            options,
            llmConfig,
            coverLetterPdf,
            (stage, node, progress, message) => {
              console.log(`[API /analyze] Progress: ${stage} - ${node} - ${progress}% - ${message}`);
              sendEvent({
                stage,
                node,
                progress,
                message,
                results: {}, // Partial results could be added here
              });
            }
          );

          console.log("[API /analyze] Pipeline completed");
          console.log("[API /analyze] Errors:", finalState.errors.length);
          console.log("[API /analyze] Has parsed resume:", !!finalState.parsedResume);
          console.log("[API /analyze] Has parsed JD:", !!finalState.parsedJd);
          console.log("[API /analyze] Has matching analysis:", !!finalState.matchingAnalysis);
          console.log("[API /analyze] Has generated resume:", !!finalState.generatedResume);

          // Send final results
          sendEvent({
            stage: "complete",
            progress: 100,
            message: "Analysis complete",
            results: {
              parsedResume: finalState.parsedResume,
              parsedJd: finalState.parsedJd,
              matchingAnalysis: finalState.matchingAnalysis,
              atsScores: finalState.atsScores,
              riskAnalysis: finalState.riskAnalysis,
              generatedResume: finalState.generatedResume,
              generatedCoverLetter: finalState.generatedCoverLetter,
              validationResult: finalState.validationResult,
              errors: finalState.errors,
            },
          });

          console.log("[API /analyze] Final event sent, closing stream");
          controller.close();
        } catch (error) {
          console.error("[API /analyze] Pipeline error:", error);
          sendEvent({
            stage: "error",
            progress: 0,
            message: error instanceof Error ? error.message : "Pipeline failed",
            error: true,
          });
          controller.close();
        }
      },
    });

    console.log("[API /analyze] Returning stream response");
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[API /analyze] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
