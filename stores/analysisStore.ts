/**
 * Analysis Store
 * Manages the analysis pipeline state and results
 */

import { create } from "zustand";
import type { ParsedResume, ParsedCoverLetter, GeneratedResume, GeneratedCoverLetter } from "@/types/resume";
import type { ParsedJobDescription, JdQualityAssessment } from "@/types/jd";
import type { MatchingAnalysis, AtsScores, RiskAnalysis, FullAnalysis } from "@/types/analysis";
import type { PipelineStage, GraphError } from "@/types/graph";

type AnalysisStatus = "idle" | "processing" | "complete" | "error";

interface AnalysisState {
  // Status
  status: AnalysisStatus;
  currentStage: PipelineStage;
  progress: number;
  progressMessage: string;

  // Parsed data
  parsedResume: ParsedResume | null;
  parsedCoverLetter: ParsedCoverLetter | null;
  parsedJd: ParsedJobDescription | null;

  // JD quality
  jdQuality: JdQualityAssessment | null;

  // Analysis results
  matchingAnalysis: MatchingAnalysis | null;
  atsScores: AtsScores | null;
  riskAnalysis: RiskAnalysis | null;

  // Generated outputs
  generatedResume: GeneratedResume | null;
  generatedCoverLetter: GeneratedCoverLetter | null;

  // Errors
  errors: GraphError[];
  errorMessage: string | null;
}

interface AnalysisActions {
  // Status updates
  startAnalysis: () => void;
  setStage: (stage: PipelineStage, message?: string) => void;
  updateProgress: (progress: number, message?: string) => void;
  setComplete: () => void;
  setError: (message: string, error?: GraphError) => void;

  // Data setters
  setParsedResume: (resume: ParsedResume) => void;
  setParsedCoverLetter: (coverLetter: ParsedCoverLetter) => void;
  setParsedJd: (jd: ParsedJobDescription) => void;
  setJdQuality: (quality: JdQualityAssessment) => void;
  setMatchingAnalysis: (analysis: MatchingAnalysis) => void;
  setAtsScores: (scores: AtsScores) => void;
  setRiskAnalysis: (analysis: RiskAnalysis) => void;
  setGeneratedResume: (resume: GeneratedResume) => void;
  setGeneratedCoverLetter: (coverLetter: GeneratedCoverLetter) => void;

  // Bulk update
  setFullAnalysis: (analysis: FullAnalysis) => void;

  // Reset
  reset: () => void;
}

type AnalysisStore = AnalysisState & AnalysisActions;

const initialState: AnalysisState = {
  status: "idle",
  currentStage: "idle",
  progress: 0,
  progressMessage: "Ready to analyze",
  parsedResume: null,
  parsedCoverLetter: null,
  parsedJd: null,
  jdQuality: null,
  matchingAnalysis: null,
  atsScores: null,
  riskAnalysis: null,
  generatedResume: null,
  generatedCoverLetter: null,
  errors: [],
  errorMessage: null,
};

const stageProgress: Record<PipelineStage, number> = {
  idle: 0,
  parsing: 10,
  ingesting: 20,
  detecting: 30,
  splitting: 35,
  matching: 45,
  scoring: 55,
  analyzing: 65,
  rewriting: 75,
  generating: 85,
  validating: 95,
  complete: 100,
  error: -1,
};

const stageMessages: Record<PipelineStage, string> = {
  idle: "Ready to analyze",
  parsing: "Parsing documents...",
  ingesting: "Processing job description...",
  detecting: "Checking JD quality...",
  splitting: "Analyzing role requirements...",
  matching: "Matching skills and experience...",
  scoring: "Calculating ATS scores...",
  analyzing: "Identifying strengths and gaps...",
  rewriting: "Optimizing resume...",
  generating: "Creating cover letter...",
  validating: "Validating outputs...",
  complete: "Analysis complete!",
  error: "An error occurred",
};

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  ...initialState,

  startAnalysis: () => {
    set({
      status: "processing",
      currentStage: "parsing",
      progress: 5,
      progressMessage: "Starting analysis...",
      errors: [],
      errorMessage: null,
    });
  },

  setStage: (stage, message) => {
    set({
      currentStage: stage,
      progress: stageProgress[stage],
      progressMessage: message ?? stageMessages[stage],
    });
  },

  updateProgress: (progress, message) => {
    set((state) => ({
      progress,
      progressMessage: message ?? state.progressMessage,
    }));
  },

  setComplete: () => {
    set({
      status: "complete",
      currentStage: "complete",
      progress: 100,
      progressMessage: "Analysis complete!",
    });
  },

  setError: (message, error) => {
    set((state) => ({
      status: "error",
      currentStage: "error",
      errorMessage: message,
      errors: error ? [...state.errors, error] : state.errors,
    }));
  },

  setParsedResume: (resume) => {
    set({ parsedResume: resume });
  },

  setParsedCoverLetter: (coverLetter) => {
    set({ parsedCoverLetter: coverLetter });
  },

  setParsedJd: (jd) => {
    set({ parsedJd: jd });
  },

  setJdQuality: (quality) => {
    set({ jdQuality: quality });
  },

  setMatchingAnalysis: (analysis) => {
    set({ matchingAnalysis: analysis });
  },

  setAtsScores: (scores) => {
    set({ atsScores: scores });
  },

  setRiskAnalysis: (analysis) => {
    set({ riskAnalysis: analysis });
  },

  setGeneratedResume: (resume) => {
    set({ generatedResume: resume });
  },

  setGeneratedCoverLetter: (coverLetter) => {
    set({ generatedCoverLetter: coverLetter });
  },

  setFullAnalysis: (analysis) => {
    set({
      status: "complete",
      currentStage: "complete",
      progress: 100,
      progressMessage: "Analysis complete!",
      parsedResume: analysis.resume,
      parsedCoverLetter: analysis.coverLetter,
      parsedJd: analysis.jd,
      jdQuality: analysis.jd.qualityAssessment,
      matchingAnalysis: analysis.matching,
      atsScores: analysis.atsScores,
      riskAnalysis: analysis.riskAnalysis,
      generatedResume: analysis.generatedResume,
      generatedCoverLetter: analysis.generatedCoverLetter,
    });
  },

  reset: () => {
    set(initialState);
  },
}));

// Selectors
export const selectStatus = (state: AnalysisStore) => state.status;
export const selectProgress = (state: AnalysisStore) => ({
  stage: state.currentStage,
  progress: state.progress,
  message: state.progressMessage,
});
export const selectParsedResume = (state: AnalysisStore) => state.parsedResume;
export const selectParsedJd = (state: AnalysisStore) => state.parsedJd;
export const selectMatchingAnalysis = (state: AnalysisStore) => state.matchingAnalysis;
export const selectAtsScores = (state: AnalysisStore) => state.atsScores;
export const selectRiskAnalysis = (state: AnalysisStore) => state.riskAnalysis;
export const selectGeneratedResume = (state: AnalysisStore) => state.generatedResume;
export const selectGeneratedCoverLetter = (state: AnalysisStore) => state.generatedCoverLetter;
export const selectFullAnalysis = (state: AnalysisStore): Partial<FullAnalysis> | null => {
  if (!state.parsedResume || !state.parsedJd || !state.matchingAnalysis) {
    return null;
  }
  return {
    resume: state.parsedResume,
    coverLetter: state.parsedCoverLetter ?? undefined,
    jd: state.parsedJd,
    matching: state.matchingAnalysis,
    atsScores: state.atsScores ?? undefined,
    riskAnalysis: state.riskAnalysis ?? undefined,
    generatedResume: state.generatedResume ?? undefined,
    generatedCoverLetter: state.generatedCoverLetter ?? undefined,
  };
};
export const selectErrors = (state: AnalysisStore) => state.errors;
export const selectErrorMessage = (state: AnalysisStore) => state.errorMessage;
export const selectJdQualityWarning = (state: AnalysisStore) => {
  if (!state.jdQuality) return null;
  if (state.jdQuality.isFake) {
    return {
      type: "fake" as const,
      message: "This job posting may be fake or a scam",
      confidence: state.jdQuality.fakeConfidence,
      indicators: state.jdQuality.fakeIndicators,
    };
  }
  if (state.jdQuality.qualityScore < 50) {
    return {
      type: "low_quality" as const,
      message: "This job description has quality issues",
      score: state.jdQuality.qualityScore,
      issues: state.jdQuality.qualityIssues,
    };
  }
  return null;
};
export const selectIsAnalyzing = (state: AnalysisStore) => state.status === "processing";
export const selectHasResults = (state: AnalysisStore) =>
  state.status === "complete" && state.matchingAnalysis !== null;
export const selectOverallScore = (state: AnalysisStore) =>
  state.matchingAnalysis?.overallScore ?? null;
