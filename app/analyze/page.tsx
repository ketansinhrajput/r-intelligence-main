"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Target,
  Shield,
  Zap,
  MapPin,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAnalysisStore } from "@/stores/analysisStore";
import { useDocumentStore } from "@/stores/documentStore";
import { useLLMConfigStore } from "@/stores/llmConfigStore";
import { cn } from "@/lib/utils";

export default function AnalyzePage() {
  const router = useRouter();
  const hasStartedRef = useRef(false);

  const {
    status,
    currentStage,
    progress,
    progressMessage,
    matchingAnalysis,
    atsScores,
    riskAnalysis,
    parsedJd,
    generatedResume,
    generatedCoverLetter,
    setStage,
    updateProgress,
    setComplete,
    setError,
    setParsedResume,
    setParsedJd,
    setMatchingAnalysis,
    setAtsScores,
    setRiskAnalysis,
    setGeneratedResume,
    setGeneratedCoverLetter,
  } = useAnalysisStore();

  const { resumeFile, coverLetterFile, jdSource, userOptions } = useDocumentStore();
  const { config: llmConfig } = useLLMConfigStore();

  // Start the analysis when the page loads
  useEffect(() => {
    // Prevent double execution
    if (hasStartedRef.current) {
      console.log("[AnalyzePage] Analysis already started, skipping");
      return;
    }

    // Check if we're in processing state
    if (status !== "processing") {
      console.log("[AnalyzePage] Not in processing state, redirecting to upload");
      router.push("/upload");
      return;
    }

    // Validate we have the required files
    if (!resumeFile) {
      console.error("[AnalyzePage] No resume file found");
      setError("No resume file found");
      return;
    }

    if (!jdSource.value) {
      console.error("[AnalyzePage] No JD source found");
      setError("No job description found");
      return;
    }

    hasStartedRef.current = true;
    console.log("[AnalyzePage] Starting analysis...");
    console.log("[AnalyzePage] Resume file:", resumeFile.name, resumeFile.size, "bytes");
    console.log("[AnalyzePage] JD source:", jdSource.type, jdSource.value);
    console.log("[AnalyzePage] User options:", userOptions);

    // Start the analysis
    runAnalysis();
  }, [status]);

  const runAnalysis = async () => {
    try {
      console.log("[runAnalysis] Building FormData...");

      const formData = new FormData();
      formData.append("resume", resumeFile!);

      if (coverLetterFile) {
        formData.append("coverLetter", coverLetterFile);
        console.log("[runAnalysis] Added cover letter:", coverLetterFile.name);
      }

      if (jdSource.type === "url" && typeof jdSource.value === "string") {
        formData.append("jdUrl", jdSource.value);
        console.log("[runAnalysis] Added JD URL:", jdSource.value);
      } else if (jdSource.type === "pdf" && jdSource.value instanceof File) {
        formData.append("jd", jdSource.value);
        console.log("[runAnalysis] Added JD file:", jdSource.value.name);
      }

      formData.append("resumeFormat", userOptions.resumeFormat);
      formData.append("targetAts", userOptions.targetAts);
      formData.append("region", userOptions.region);
      formData.append("coverLetterLength", userOptions.coverLetterLength);

      // LLM provider config
      formData.append("llmBaseUrl", llmConfig.baseUrl);
      formData.append("llmApiKey", llmConfig.apiKey);
      formData.append("llmModelName", llmConfig.modelName);

      console.log("[runAnalysis] Calling /api/analyze...");
      setStage("parsing", "Connecting to analysis service...");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      console.log("[runAnalysis] Response status:", response.status);
      console.log("[runAnalysis] Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[runAnalysis] API error:", errorText);
        throw new Error(`Analysis failed: ${errorText}`);
      }

      // Check if it's a streaming response
      const contentType = response.headers.get("content-type");
      console.log("[runAnalysis] Content-Type:", contentType);

      if (contentType?.includes("text/event-stream")) {
        console.log("[runAnalysis] Processing SSE stream...");
        await processStreamResponse(response);
      } else {
        console.log("[runAnalysis] Processing JSON response...");
        const data = await response.json();
        console.log("[runAnalysis] Response data:", data);
        processJsonResponse(data);
      }

    } catch (error) {
      console.error("[runAnalysis] Error:", error);
      setError(error instanceof Error ? error.message : "Analysis failed");
    }
  };

  const processStreamResponse = async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    console.log("[processStreamResponse] Starting to read stream...");

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log("[processStreamResponse] Stream ended");
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          console.log("[processStreamResponse] Received event:", jsonStr.substring(0, 200));

          try {
            const event = JSON.parse(jsonStr);
            handleStreamEvent(event);
          } catch (e) {
            console.error("[processStreamResponse] Failed to parse event:", e);
          }
        }
      }
    }
  };

  const handleStreamEvent = (event: {
    stage?: string;
    progress?: number;
    message?: string;
    error?: boolean;
    results?: Record<string, unknown>;
  }) => {
    console.log("[handleStreamEvent] Event:", event.stage, event.progress, event.message);

    if (event.error) {
      setError(event.message || "Unknown error");
      return;
    }

    // Map API stages to our stages
    const stageMap: Record<string, string> = {
      parsing: "parsing",
      analysis: "detecting",
      matching: "matching",
      scoring: "scoring",
      risks: "analyzing",
      generation: "generating",
      validation: "validating",
      complete: "complete",
    };

    const mappedStage = stageMap[event.stage || ""] || event.stage || "parsing";

    if (event.stage === "complete") {
      console.log("[handleStreamEvent] Analysis complete!");
      processResults(event.results);
      setComplete();
    } else {
      setStage(mappedStage as any, event.message);
      updateProgress(event.progress || 0);

      // Store intermediate results
      if (event.results) {
        if (event.results.matchingAnalysis) {
          setMatchingAnalysis(event.results.matchingAnalysis as any);
        }
        if (event.results.atsScores) {
          setAtsScores(event.results.atsScores as any);
        }
        if (event.results.riskAnalysis) {
          setRiskAnalysis(event.results.riskAnalysis as any);
        }
      }
    }
  };

  const processResults = (results?: Record<string, unknown>) => {
    if (!results) return;

    console.log("[processResults] Processing final results...");

    if (results.parsedResume) {
      console.log("[processResults] Setting parsed resume");
      setParsedResume(results.parsedResume as any);
    }
    if (results.parsedJd) {
      console.log("[processResults] Setting parsed JD");
      setParsedJd(results.parsedJd as any);
    }
    if (results.matchingAnalysis) {
      console.log("[processResults] Setting matching analysis");
      setMatchingAnalysis(results.matchingAnalysis as any);
    }
    if (results.atsScores) {
      console.log("[processResults] Setting ATS scores");
      setAtsScores(results.atsScores as any);
    }
    if (results.riskAnalysis) {
      console.log("[processResults] Setting risk analysis");
      setRiskAnalysis(results.riskAnalysis as any);
    }
    if (results.generatedResume) {
      console.log("[processResults] Setting generated resume");
      setGeneratedResume(results.generatedResume as any);
    }
    if (results.generatedCoverLetter) {
      console.log("[processResults] Setting generated cover letter");
      setGeneratedCoverLetter(results.generatedCoverLetter as any);
    }
  };

  const processJsonResponse = (data: Record<string, unknown>) => {
    if (data.error) {
      setError(data.error as string);
      return;
    }

    processResults(data.results as Record<string, unknown>);
    setComplete();
  };

  // Mock data for demonstration (fallback when no real data)
  const displayData = {
    overallScore: matchingAnalysis?.overallScore ?? 78,
    atsConservative: atsScores?.conservative?.score ?? 72,
    atsAggressive: atsScores?.aggressive?.score ?? 85,
    matchedSkills: matchingAnalysis?.skillMatch?.totalMatched ?? 12,
    missingSkills: matchingAnalysis?.skillMatch?.missingSkills?.length ?? 3,
    transferableSkills: matchingAnalysis?.skillMatch?.transferableSkills?.length ?? 2,
  };

  const isComplete = status === "complete";
  const isProcessing = status === "processing";
  const hasError = status === "error";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          {isComplete && (
            <Button onClick={() => router.push("/editor")}>
              Edit & Export
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <main className="container py-8">
        <div className="mx-auto max-w-6xl">
          {/* Back link */}
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to upload
          </Link>

          {/* Processing State */}
          {isProcessing && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Analyzing Your Documents</CardTitle>
                <CardDescription>{progressMessage}</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-2" />
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <StageIndicator
                    label="Parsing"
                    status={getStageStatus("parsing", currentStage)}
                  />
                  <StageIndicator
                    label="Matching"
                    status={getStageStatus("matching", currentStage)}
                  />
                  <StageIndicator
                    label="Scoring"
                    status={getStageStatus("scoring", currentStage)}
                  />
                  <StageIndicator
                    label="Generating"
                    status={getStageStatus("generating", currentStage)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {hasError && (
            <Card className="mb-8 border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  Analysis Failed
                </CardTitle>
                <CardDescription>
                  Something went wrong during the analysis. Please try again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/upload")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results Dashboard */}
          {(isComplete || isProcessing) && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold">Analysis Results</h1>
                <p className="text-muted-foreground mt-2">
                  Review your resume match analysis and ATS scores
                </p>
              </div>

              {/* Score Overview */}
              <div className="grid gap-4 md:grid-cols-3">
                <ScoreCard
                  title="Overall Match"
                  score={displayData.overallScore}
                  icon={<Target className="h-5 w-5" />}
                  description="How well your resume matches the job"
                />
                <ScoreCard
                  title="ATS Score (Conservative)"
                  score={displayData.atsConservative}
                  icon={<Shield className="h-5 w-5" />}
                  description="Strict keyword matching"
                  threshold={75}
                />
                <ScoreCard
                  title="ATS Score (Aggressive)"
                  score={displayData.atsAggressive}
                  icon={<Zap className="h-5 w-5" />}
                  description="Semantic matching enabled"
                  threshold={60}
                />
              </div>

              {/* Skills Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills Analysis</CardTitle>
                  <CardDescription>
                    Comparison of your skills against job requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <SkillMetric
                      label="Matched Skills"
                      count={displayData.matchedSkills}
                      variant="success"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                    />
                    <SkillMetric
                      label="Missing Skills"
                      count={displayData.missingSkills}
                      variant="destructive"
                      icon={<XCircle className="h-4 w-4" />}
                    />
                    <SkillMetric
                      label="Transferable"
                      count={displayData.transferableSkills}
                      variant="warning"
                      icon={<TrendingUp className="h-4 w-4" />}
                    />
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-green-600 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Matched Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(matchingAnalysis?.skillMatch?.matchedSkills?.map(s => s.skill) ||
                          ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker", "Git", "REST APIs", "GraphQL", "CI/CD", "Agile", "Testing"]).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2 text-red-600 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Missing Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(matchingAnalysis?.skillMatch?.missingSkills?.map(s => s.skill) ||
                          ["Kubernetes", "Terraform", "Go"]).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* JD Intelligence */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description Intelligence</CardTitle>
                  <CardDescription>
                    Extracted information from the job posting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoItem
                      icon={<MapPin className="h-4 w-4" />}
                      label="Location"
                      value={parsedJd?.location?.primary || "Remote / Hybrid"}
                    />
                    <InfoItem
                      icon={<DollarSign className="h-4 w-4" />}
                      label="Salary Range"
                      value={parsedJd?.compensation?.salaryMin && parsedJd?.compensation?.salaryMax
                        ? `$${parsedJd.compensation.salaryMin / 1000}k - $${parsedJd.compensation.salaryMax / 1000}k`
                        : "Not specified"}
                    />
                    <InfoItem
                      icon={<Briefcase className="h-4 w-4" />}
                      label="Seniority"
                      value={parsedJd?.seniority?.level || "Senior"}
                    />
                    <InfoItem
                      icon={<Target className="h-4 w-4" />}
                      label="Experience"
                      value={parsedJd?.seniority?.yearsExperienceMin
                        ? `${parsedJd.seniority.yearsExperienceMin}+ years`
                        : "5+ years"}
                    />
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Benefits Mentioned</h4>
                    <div className="flex flex-wrap gap-2">
                      {(parsedJd?.benefits || ["Health Insurance", "401k", "Remote Work", "Unlimited PTO", "Stock Options", "Learning Budget"]).map((benefit) => (
                        <span
                          key={benefit}
                          className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Strengths & Gaps</CardTitle>
                  <CardDescription>
                    Areas where you excel and areas to address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-green-600 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {(riskAnalysis?.strengths || [
                          { title: "Strong experience with React and TypeScript" },
                          { title: "Relevant cloud infrastructure background" },
                          { title: "Team leadership experience" },
                        ]).map((strength, i) => (
                          <StrengthItem key={i} text={strength.title} />
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-orange-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Gaps to Address
                      </h4>
                      <ul className="space-y-2">
                        {(riskAnalysis?.gaps || [
                          { title: "No Kubernetes experience mentioned", severity: "moderate" as const },
                          { title: "Infrastructure as Code skills could be highlighted", severity: "minor" as const },
                        ]).map((gap, i) => (
                          <GapItem
                            key={i}
                            text={gap.title}
                            severity={gap.severity}
                          />
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Button */}
              {isComplete && (
                <div className="flex justify-end">
                  <Button size="lg" onClick={() => router.push("/editor")}>
                    Continue to Editor
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getStageStatus(
  stage: string,
  currentStage: string
): "pending" | "active" | "complete" {
  const stages = ["parsing", "matching", "scoring", "generating"];
  const stageIndex = stages.indexOf(stage);

  // Map currentStage to our simplified stages
  const stageMapping: Record<string, number> = {
    idle: -1,
    parsing: 0,
    ingesting: 0,
    detecting: 0,
    splitting: 0,
    matching: 1,
    scoring: 2,
    analyzing: 2,
    rewriting: 3,
    generating: 3,
    validating: 3,
    complete: 4,
    error: -1,
  };

  const currentIndex = stageMapping[currentStage] ?? -1;

  if (currentStage === "complete") return "complete";
  if (stageIndex < currentIndex) return "complete";
  if (stageIndex === currentIndex) return "active";
  return "pending";
}

function StageIndicator({
  label,
  status,
}: {
  label: string;
  status: "pending" | "active" | "complete";
}) {
  return (
    <div className="flex items-center gap-2">
      {status === "complete" && (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      )}
      {status === "active" && (
        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      )}
      {status === "pending" && (
        <div className="h-4 w-4 rounded-full border-2 border-muted" />
      )}
      <span
        className={cn(
          "text-sm",
          status === "complete" && "text-green-600",
          status === "active" && "text-primary font-medium",
          status === "pending" && "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function ScoreCard({
  title,
  score,
  icon,
  description,
  threshold,
}: {
  title: string;
  score: number;
  icon: React.ReactNode;
  description: string;
  threshold?: number;
}) {
  const passesThreshold = threshold ? score >= threshold : true;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground">{icon}</span>
          {threshold && (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                passesThreshold
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              )}
            >
              {passesThreshold ? "Passes" : "Below"} {threshold}%
            </span>
          )}
        </div>
        <div className="text-3xl font-bold mb-1">{score}%</div>
        <div className="text-sm font-medium">{title}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function SkillMetric({
  label,
  count,
  variant,
  icon,
}: {
  label: string;
  count: number;
  variant: "success" | "destructive" | "warning";
  icon: React.ReactNode;
}) {
  const colors = {
    success: "text-green-600",
    destructive: "text-red-600",
    warning: "text-yellow-600",
  };

  return (
    <div className="text-center">
      <div className={cn("text-3xl font-bold", colors[variant])}>{count}</div>
      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
        <span className={colors[variant]}>{icon}</span>
        {label}
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function StrengthItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
      <span>{text}</span>
    </li>
  );
}

function GapItem({ text, severity }: { text: string; severity: "minor" | "moderate" | "critical" }) {
  const colors = {
    minor: "text-blue-500",
    moderate: "text-orange-500",
    critical: "text-red-500",
  };

  return (
    <li className="flex items-start gap-2 text-sm">
      <AlertTriangle className={cn("h-4 w-4 mt-0.5 shrink-0", colors[severity])} />
      <span>{text}</span>
    </li>
  );
}
