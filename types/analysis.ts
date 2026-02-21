/**
 * Analysis Type Definitions
 */

import type {
  ParsedResume,
  ParsedCoverLetter,
  GeneratedResume,
  GeneratedCoverLetter,
  ResumeFormat,
} from "./resume";
import type { ParsedJobDescription } from "./jd";

// Re-export types from resume for convenience
export type { GeneratedResume, GeneratedCoverLetter, ParsedCoverLetter, ResumeFormat } from "./resume";

// Enums
export type AtsSystem = "workday" | "greenhouse" | "lever" | "generic";
export type Region = "eu" | "uk" | "us" | "india" | "germany" | "uae";
export type CoverLetterLength = "short" | "medium" | "long";
export type MatchStrength = "strong" | "moderate" | "weak";
export type SkillImportance = "required" | "preferred" | "nice_to_have";
export type ExperienceMatchStatus = "exceeds" | "meets" | "below" | "unknown";
export type EducationMatchStatus = "exceeds" | "meets" | "below" | "not_required";
export type SeniorityMatchStatus =
  | "over_qualified"
  | "qualified"
  | "under_qualified"
  | "unknown";
export type RiskLevel = "low" | "medium" | "high";
export type GapSeverity = "critical" | "moderate" | "minor";
export type RiskCategory =
  | "experience"
  | "skill"
  | "culture"
  | "logistics"
  | "other";

// User Options
export interface UserOptions {
  resumeFormat: ResumeFormat;
  targetAts: AtsSystem;
  region: Region;
  coverLetterLength: CoverLetterLength;
}

// Skill Matching
export interface MatchedSkill {
  skill: string;
  jdRequirement: string;
  resumeEvidence: string;
  strength: MatchStrength;
}

export interface MissingSkill {
  skill: string;
  jdRequirement: string;
  importance: SkillImportance;
  suggestion: string | null;
}

export interface TransferableSkill {
  candidateSkill: string;
  targetSkill: string;
  transferability: number;
  justification: string;
}

export interface SkillMatchAnalysis {
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  transferableSkills: TransferableSkill[];
  totalRequired: number;
  totalMatched: number;
  matchPercentage: number;
}

// Experience Matching
export interface RelevantExperience {
  experienceId: string;
  company: string;
  title: string;
  relevanceScore: number;
  matchingResponsibilities: string[];
}

export interface ExperienceMatchAnalysis {
  yearsRequired: number | null;
  yearsCandidate: number;
  matchStatus: ExperienceMatchStatus;
  relevantExperiences: RelevantExperience[];
}

// Education Matching
export interface EducationMatchAnalysis {
  required: string | null;
  candidate: string;
  matchStatus: EducationMatchStatus;
  notes: string | null;
}

// Role Alignment
export interface TitleMatchInfo {
  jdTitle: string;
  resumeTitle: string;
  alignmentScore: number;
  isLateralMove: boolean;
  isPromotion: boolean;
  isCareerChange: boolean;
}

export interface SeniorityMatchInfo {
  jdLevel: string;
  candidateLevel: string;
  matchStatus: SeniorityMatchStatus;
}

export interface RoleAlignmentAnalysis {
  titleMatch: TitleMatchInfo;
  seniorityMatch: SeniorityMatchInfo;
}

// Full Matching Analysis
export interface MatchingAnalysis {
  overallScore: number;
  explanation: string;
  skillMatch: SkillMatchAnalysis;
  experienceMatch: ExperienceMatchAnalysis;
  educationMatch: EducationMatchAnalysis;
  roleAlignment: RoleAlignmentAnalysis;
}

// ATS Scores
export interface AtsScoreBreakdown {
  keywordMatch: number;
  formatCompliance: number;
  sectionCompleteness: number;
  experienceRelevance: number;
  educationMatch: number;
}

export interface AtsScoreResult {
  score: number;
  model: string;
  breakdown: AtsScoreBreakdown;
  passesThreshold: boolean;
  threshold: number;
  recommendations: string[];
}

export interface AtsScores {
  conservative: AtsScoreResult;
  aggressive: AtsScoreResult;
  targetSystem: AtsScoreResult;
  beforeRewrite: AtsScoreResult;
  afterRewrite: AtsScoreResult | null;
  scoreChangeExplanation: string | null;
}

// Risk Analysis
export interface StrengthItem {
  title: string;
  description: string;
  evidence: string;
  impact: RiskLevel;
}

export interface GapItem {
  title: string;
  description: string;
  jdRequirement: string;
  severity: GapSeverity;
  mitigation: string | null;
}

export interface RiskItem {
  title: string;
  description: string;
  category: RiskCategory;
  severity: RiskLevel;
  recommendation: string;
}

export interface RiskAnalysis {
  strengths: StrengthItem[];
  gaps: GapItem[];
  risks: RiskItem[];
  overallRiskLevel: RiskLevel;
}

// Full Analysis
export interface FullAnalysis {
  id: string;
  createdAt: string;
  resume: ParsedResume;
  coverLetter: ParsedCoverLetter | null;
  jd: ParsedJobDescription;
  userOptions: UserOptions;
  matching: MatchingAnalysis;
  atsScores: AtsScores;
  riskAnalysis: RiskAnalysis;
  generatedResume: GeneratedResume | null;
  generatedCoverLetter: GeneratedCoverLetter | null;
}

// Factory functions
export function createDefaultUserOptions(): UserOptions {
  return {
    resumeFormat: "chronological",
    targetAts: "generic",
    region: "us",
    coverLetterLength: "medium",
  };
}

export function createEmptyMatchingAnalysis(): MatchingAnalysis {
  return {
    overallScore: 0,
    explanation: "",
    skillMatch: {
      matchedSkills: [],
      missingSkills: [],
      transferableSkills: [],
      totalRequired: 0,
      totalMatched: 0,
      matchPercentage: 0,
    },
    experienceMatch: {
      yearsRequired: null,
      yearsCandidate: 0,
      matchStatus: "unknown",
      relevantExperiences: [],
    },
    educationMatch: {
      required: null,
      candidate: "",
      matchStatus: "not_required",
      notes: null,
    },
    roleAlignment: {
      titleMatch: {
        jdTitle: "",
        resumeTitle: "",
        alignmentScore: 0,
        isLateralMove: false,
        isPromotion: false,
        isCareerChange: false,
      },
      seniorityMatch: {
        jdLevel: "",
        candidateLevel: "",
        matchStatus: "unknown",
      },
    },
  };
}

export function createEmptyAtsScores(): AtsScores {
  const emptyScore: AtsScoreResult = {
    score: 0,
    model: "",
    breakdown: {
      keywordMatch: 0,
      formatCompliance: 0,
      sectionCompleteness: 0,
      experienceRelevance: 0,
      educationMatch: 0,
    },
    passesThreshold: false,
    threshold: 75,
    recommendations: [],
  };

  return {
    conservative: { ...emptyScore, model: "conservative" },
    aggressive: { ...emptyScore, model: "aggressive" },
    targetSystem: { ...emptyScore, model: "target" },
    beforeRewrite: { ...emptyScore, model: "before" },
    afterRewrite: null,
    scoreChangeExplanation: null,
  };
}

export function createEmptyRiskAnalysis(): RiskAnalysis {
  return {
    strengths: [],
    gaps: [],
    risks: [],
    overallRiskLevel: "medium",
  };
}

// Helper functions
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}

export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "text-green-600";
    case "medium":
      return "text-yellow-600";
    case "high":
      return "text-red-600";
  }
}

export function getSeverityColor(severity: GapSeverity): string {
  switch (severity) {
    case "minor":
      return "text-blue-600";
    case "moderate":
      return "text-yellow-600";
    case "critical":
      return "text-red-600";
  }
}
