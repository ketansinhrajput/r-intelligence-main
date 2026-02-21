/**
 * Job Description Type Definitions
 */

// Enums
export type JdSource = "url" | "pdf";
export type CompanySize = "startup" | "mid" | "enterprise";
export type LocationType = "remote" | "hybrid" | "onsite" | "not_specified";
export type SeniorityLevel =
  | "intern"
  | "entry"
  | "mid"
  | "senior"
  | "staff"
  | "principal"
  | "director"
  | "vp"
  | "c-level";
export type CompensationType = "annual" | "hourly" | "contract";
export type RequirementCategory =
  | "skill"
  | "experience"
  | "education"
  | "certification"
  | "soft_skill"
  | "other";

// JD Metadata
export interface JdMetadata {
  source: JdSource;
  sourceUrl: string | null;
  scrapedAt: string;
  company: string;
  confidence: number;
}

// Company Information
export interface CompanyInfo {
  name: string;
  industry: string | null;
  size: CompanySize | null;
  description: string | null;
}

// Location Information
export interface LocationInfo {
  type: LocationType;
  primary: string | null;
  additionalLocations: string[];
  relocationOffered: boolean | null;
  visaSponsorship: boolean | null;
}

// Seniority Information
export interface SeniorityInfo {
  level: SeniorityLevel;
  yearsExperienceMin: number | null;
  yearsExperienceMax: number | null;
}

// Compensation Information
export interface CompensationInfo {
  specified: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  type: CompensationType | null;
  equity: boolean | null;
  bonus: boolean | null;
}

// Individual Requirement
export interface Requirement {
  id: string;
  text: string;
  category: RequirementCategory;
  skills: string[];
  yearsRequired: number | null;
}

// Requirements grouping
export interface RequirementsInfo {
  required: Requirement[];
  preferred: Requirement[];
  niceToHave: Requirement[];
}

// JD Quality Assessment
export interface JdQualityAssessment {
  isFake: boolean;
  fakeConfidence: number;
  fakeIndicators: string[];
  qualityScore: number;
  qualityIssues: string[];
  redFlags: string[];
}

// Multi-role Detection
export interface DetectedRole {
  title: string;
  confidence: number;
  matchingRequirements: string[];
}

export interface MultiRoleDetection {
  isMultiRole: boolean;
  roles: DetectedRole[];
  primaryRole: string | null;
}

// Parsed Job Description
export interface ParsedJobDescription {
  metadata: JdMetadata;
  title: string;
  company: CompanyInfo;
  location: LocationInfo;
  seniority: SeniorityInfo;
  compensation: CompensationInfo;
  requirements: RequirementsInfo;
  responsibilities: string[];
  benefits: string[];
  applicationDeadline: string | null;
  qualityAssessment: JdQualityAssessment;
  multiRoleDetection: MultiRoleDetection;
  rawText: string;
}

// JD Input (for the upload form)
export interface JdInput {
  type: JdSource;
  url: string | null;
  file: File | null;
}

// Factory function
export function createEmptyJd(): ParsedJobDescription {
  return {
    metadata: {
      source: "pdf",
      sourceUrl: null,
      scrapedAt: new Date().toISOString(),
      company: "",
      confidence: 0,
    },
    title: "",
    company: {
      name: "",
      industry: null,
      size: null,
      description: null,
    },
    location: {
      type: "not_specified",
      primary: null,
      additionalLocations: [],
      relocationOffered: null,
      visaSponsorship: null,
    },
    seniority: {
      level: "mid",
      yearsExperienceMin: null,
      yearsExperienceMax: null,
    },
    compensation: {
      specified: false,
      salaryMin: null,
      salaryMax: null,
      currency: null,
      type: null,
      equity: null,
      bonus: null,
    },
    requirements: {
      required: [],
      preferred: [],
      niceToHave: [],
    },
    responsibilities: [],
    benefits: [],
    applicationDeadline: null,
    qualityAssessment: {
      isFake: false,
      fakeConfidence: 0,
      fakeIndicators: [],
      qualityScore: 100,
      qualityIssues: [],
      redFlags: [],
    },
    multiRoleDetection: {
      isMultiRole: false,
      roles: [],
      primaryRole: null,
    },
    rawText: "",
  };
}

// Helper functions
export function getAllRequiredSkills(jd: ParsedJobDescription): string[] {
  return jd.requirements.required.flatMap((r) => r.skills);
}

export function getAllSkills(jd: ParsedJobDescription): string[] {
  const allReqs = [
    ...jd.requirements.required,
    ...jd.requirements.preferred,
    ...jd.requirements.niceToHave,
  ];
  return [...new Set(allReqs.flatMap((r) => r.skills))];
}

export function getMinYearsRequired(jd: ParsedJobDescription): number | null {
  const yearsReqs = jd.requirements.required
    .filter((r) => r.yearsRequired !== null)
    .map((r) => r.yearsRequired as number);

  if (yearsReqs.length === 0) return jd.seniority.yearsExperienceMin;
  return Math.max(...yearsReqs, jd.seniority.yearsExperienceMin ?? 0);
}
