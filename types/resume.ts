/**
 * Resume and Cover Letter Type Definitions
 */

// Enums
export type ImpactLevel = "high" | "medium" | "low";
export type MetricType = "percentage" | "number" | "currency" | "time" | "scale";
export type SkillProficiency = "expert" | "advanced" | "intermediate" | "beginner";
export type LanguageProficiency = "native" | "fluent" | "professional" | "conversational" | "basic";
export type ResumeFormat = "chronological" | "hybrid" | "functional";
export type ChangeType = "reorder" | "reword" | "add_keyword" | "format";
export type ParagraphType = "opening" | "body" | "closing";

// Metadata
export interface ResumeMetadata {
  fileName: string;
  pageCount: number;
  parsedAt: string;
  confidence: number;
}

// Contact Information
export interface ContactInfo {
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
}

// Extracted Metrics from bullet points
export interface ExtractedMetric {
  value: string;
  type: MetricType;
  context: string;
  isInferred: boolean;
}

// Bullet Points
export interface BulletPoint {
  id: string;
  original: string;
  metrics: ExtractedMetric[];
  actionVerb: string | null;
  impactLevel: ImpactLevel;
}

// Work Experience
export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  bullets: BulletPoint[];
  technologies: string[];
}

// Education
export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string | null;
  gpa: string | null;
  startDate: string | null;
  endDate: string | null;
  honors: string[];
}

// Skills
export interface Skill {
  name: string;
  proficiency: SkillProficiency | null;
  yearsOfExperience: number | null;
  lastUsed: string | null;
}

export interface SkillCategory {
  category: string;
  skills: Skill[];
}

// Certifications
export interface Certification {
  name: string;
  issuer: string;
  date: string | null;
  expirationDate: string | null;
  credentialId: string | null;
}

// Projects
export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url: string | null;
  startDate: string | null;
  endDate: string | null;
}

// Awards
export interface Award {
  name: string;
  issuer: string;
  date: string | null;
  description: string | null;
}

// Languages
export interface Language {
  language: string;
  proficiency: LanguageProficiency;
}

// Parsed Resume
export interface ParsedResume {
  metadata: ResumeMetadata;
  contact: ContactInfo;
  summary: string | null;
  experience: WorkExperience[];
  education: Education[];
  skills: SkillCategory[];
  certifications: Certification[];
  projects: Project[];
  awards: Award[];
  languages: Language[];
  rawText: string;
}

// Parsed Cover Letter
export interface ParsedCoverLetter {
  metadata: {
    fileName: string;
    parsedAt: string;
    wordCount: number;
  };
  content: string;
  paragraphs: {
    type: ParagraphType;
    content: string;
  }[];
  rawText: string;
}

// Resume Change (for tracking modifications)
export interface ResumeChange {
  section: string;
  type: ChangeType;
  original: string;
  modified: string;
  reason: string;
}

// Generated Resume
export interface GeneratedResume {
  id: string;
  version: number;
  format: ResumeFormat;
  content: ParsedResume;
  changes: ResumeChange[];
  complianceNotes: string[];
  atsOptimizations: string[];
}

// Cover Letter Paragraph
export interface CoverLetterParagraph {
  type: ParagraphType;
  content: string;
  purpose: string;
}

// Generated Cover Letter
export interface GeneratedCoverLetter {
  id: string;
  version: number;
  content: string;
  paragraphs: CoverLetterParagraph[];
  companyPersonalization: string[];
  roleAlignment: string[];
  wordCount: number;
}

// Factory functions
export function createEmptyResume(): ParsedResume {
  return {
    metadata: {
      fileName: "",
      pageCount: 0,
      parsedAt: new Date().toISOString(),
      confidence: 0,
    },
    contact: {
      name: "",
      email: null,
      phone: null,
      location: null,
      linkedin: null,
      github: null,
      portfolio: null,
    },
    summary: null,
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    awards: [],
    languages: [],
    rawText: "",
  };
}

export function createEmptyCoverLetter(): ParsedCoverLetter {
  return {
    metadata: {
      fileName: "",
      parsedAt: new Date().toISOString(),
      wordCount: 0,
    },
    content: "",
    paragraphs: [],
    rawText: "",
  };
}
