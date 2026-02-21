/**
 * ATS Scoring Models
 * Implements scoring algorithms for different ATS systems
 */

import type { AtsSystem } from "@/types/analysis";

export interface ATSScoreConfig {
  keywordMatchWeight: number;
  formatComplianceWeight: number;
  sectionCompletenessWeight: number;
  experienceRelevanceWeight: number;
  educationMatchWeight: number;
  passingThreshold: number;
  synonymTolerance: number;
}

export interface ATSSystemRules {
  keywordDensityMultiplier: number;
  formatStrictness: "high" | "medium" | "low";
  preferredFormat: "chronological" | "hybrid" | "functional" | "any";
  headerRequirements: string[];
  penaltyForCreativeFormatting: number;
  maxResumeLength: number;
}

export interface ATSBreakdown {
  keywordMatch: number;
  formatCompliance: number;
  sectionCompleteness: number;
  experienceRelevance: number;
  educationMatch: number;
}

export interface ScoreResult {
  score: number;
  breakdown: ATSBreakdown;
  passesThreshold: boolean;
  threshold: number;
  recommendations: string[];
  keywordsFound: string[];
  keywordsMissing: string[];
}

/**
 * Scoring configurations per model type
 */
export const SCORING_CONFIGS: Record<"conservative" | "aggressive", ATSScoreConfig> = {
  conservative: {
    keywordMatchWeight: 0.35,
    formatComplianceWeight: 0.25,
    sectionCompletenessWeight: 0.15,
    experienceRelevanceWeight: 0.15,
    educationMatchWeight: 0.10,
    passingThreshold: 75,
    synonymTolerance: 0.5,
  },
  aggressive: {
    keywordMatchWeight: 0.30,
    formatComplianceWeight: 0.15,
    sectionCompletenessWeight: 0.15,
    experienceRelevanceWeight: 0.25,
    educationMatchWeight: 0.15,
    passingThreshold: 60,
    synonymTolerance: 0.85,
  },
};

/**
 * ATS system-specific rules
 */
export const ATS_SYSTEM_RULES: Record<AtsSystem, ATSSystemRules> = {
  workday: {
    keywordDensityMultiplier: 1.2,
    formatStrictness: "high",
    preferredFormat: "chronological",
    headerRequirements: ["Experience", "Education", "Skills"],
    penaltyForCreativeFormatting: 15,
    maxResumeLength: 2,
  },
  greenhouse: {
    keywordDensityMultiplier: 1.0,
    formatStrictness: "medium",
    preferredFormat: "any",
    headerRequirements: ["Experience", "Skills"],
    penaltyForCreativeFormatting: 5,
    maxResumeLength: 3,
  },
  lever: {
    keywordDensityMultiplier: 0.9,
    formatStrictness: "low",
    preferredFormat: "any",
    headerRequirements: ["Experience"],
    penaltyForCreativeFormatting: 0,
    maxResumeLength: 3,
  },
  generic: {
    keywordDensityMultiplier: 1.0,
    formatStrictness: "medium",
    preferredFormat: "chronological",
    headerRequirements: ["Experience", "Education", "Skills"],
    penaltyForCreativeFormatting: 10,
    maxResumeLength: 2,
  },
};

/**
 * Common skill synonyms for matching
 */
const SKILL_SYNONYMS: Record<string, string[]> = {
  javascript: ["js", "ecmascript", "es6", "es2015"],
  typescript: ["ts"],
  react: ["reactjs", "react.js"],
  node: ["nodejs", "node.js"],
  python: ["py", "python3"],
  kubernetes: ["k8s"],
  postgresql: ["postgres", "psql"],
  mongodb: ["mongo"],
  aws: ["amazon web services"],
  gcp: ["google cloud", "google cloud platform"],
  azure: ["microsoft azure"],
  ci_cd: ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
  api: ["rest api", "restful api", "web api"],
  graphql: ["gql"],
  docker: ["containerization", "containers"],
  agile: ["scrum", "kanban"],
  git: ["github", "gitlab", "version control"],
};

/**
 * Calculate keyword match score
 */
function calculateKeywordMatch(
  resumeText: string,
  jdKeywords: string[],
  synonymTolerance: number
): { score: number; found: string[]; missing: string[] } {
  const normalizedResume = resumeText.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];

  for (const keyword of jdKeywords) {
    const normalizedKeyword = keyword.toLowerCase();

    // Check exact match
    if (normalizedResume.includes(normalizedKeyword)) {
      found.push(keyword);
      continue;
    }

    // Check synonyms
    let synonymFound = false;
    for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
      if (
        normalizedKeyword === canonical ||
        synonyms.includes(normalizedKeyword)
      ) {
        // Check if any form exists in resume
        const allForms = [canonical, ...synonyms];
        if (allForms.some((form) => normalizedResume.includes(form))) {
          found.push(keyword);
          synonymFound = true;
          break;
        }
      }
    }

    if (!synonymFound) {
      missing.push(keyword);
    }
  }

  const matchRatio = jdKeywords.length > 0 ? found.length / jdKeywords.length : 0;
  const score = Math.round(matchRatio * 100);

  return { score, found, missing };
}

/**
 * Calculate format compliance score
 */
function calculateFormatCompliance(
  resumeText: string,
  systemRules: ATSSystemRules
): number {
  let score = 100;

  // Check for required sections
  for (const header of systemRules.headerRequirements) {
    const headerPattern = new RegExp(`\\b${header}\\b`, "i");
    if (!headerPattern.test(resumeText)) {
      score -= 10;
    }
  }

  // Check for problematic formatting indicators
  const problematicPatterns = [
    /\t{2,}/g, // Multiple tabs
    /│|├|└|┐|┌/g, // Box drawing characters
    /★|☆|●|○|◆|◇/g, // Decorative symbols
  ];

  for (const pattern of problematicPatterns) {
    if (pattern.test(resumeText)) {
      score -= systemRules.penaltyForCreativeFormatting / 3;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate section completeness score
 */
function calculateSectionCompleteness(resumeText: string): number {
  const requiredSections = [
    { name: "contact", patterns: [/@|email|phone|\d{3}[-.]?\d{3}[-.]?\d{4}/i] },
    { name: "experience", patterns: [/experience|employment|work history/i] },
    { name: "education", patterns: [/education|degree|university|college/i] },
    { name: "skills", patterns: [/skills|technologies|proficiencies/i] },
  ];

  let sectionsFound = 0;

  for (const section of requiredSections) {
    if (section.patterns.some((pattern) => pattern.test(resumeText))) {
      sectionsFound++;
    }
  }

  return Math.round((sectionsFound / requiredSections.length) * 100);
}

/**
 * Calculate experience relevance score (simplified)
 */
function calculateExperienceRelevance(
  resumeText: string,
  jdResponsibilities: string[]
): number {
  if (jdResponsibilities.length === 0) return 70; // Default score if no responsibilities

  const normalizedResume = resumeText.toLowerCase();
  let matches = 0;

  for (const responsibility of jdResponsibilities) {
    // Extract key action verbs and nouns
    const keywords = responsibility
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 4);

    const keywordMatches = keywords.filter((kw) =>
      normalizedResume.includes(kw)
    ).length;

    if (keywordMatches >= keywords.length * 0.3) {
      matches++;
    }
  }

  return Math.round((matches / jdResponsibilities.length) * 100);
}

/**
 * Calculate education match score
 */
function calculateEducationMatch(
  resumeText: string,
  requiredEducation: string | null
): number {
  if (!requiredEducation) return 100; // No requirement = full score

  const normalizedResume = resumeText.toLowerCase();
  const normalizedReq = requiredEducation.toLowerCase();

  // Check for degree levels
  const degreePatterns = [
    { level: "phd", patterns: ["ph.d", "phd", "doctorate", "doctoral"] },
    { level: "masters", patterns: ["master", "m.s.", "m.a.", "mba", "ms ", "ma "] },
    { level: "bachelors", patterns: ["bachelor", "b.s.", "b.a.", "bs ", "ba ", "undergraduate"] },
    { level: "associate", patterns: ["associate", "a.s.", "a.a."] },
  ];

  // Find required level
  let requiredLevel = -1;
  for (let i = 0; i < degreePatterns.length; i++) {
    if (degreePatterns[i]!.patterns.some((p) => normalizedReq.includes(p))) {
      requiredLevel = i;
      break;
    }
  }

  // Find candidate level
  let candidateLevel = -1;
  for (let i = 0; i < degreePatterns.length; i++) {
    if (degreePatterns[i]!.patterns.some((p) => normalizedResume.includes(p))) {
      candidateLevel = i;
      break;
    }
  }

  if (requiredLevel === -1) return 100; // Can't determine requirement
  if (candidateLevel === -1) return 50; // Can't find education

  if (candidateLevel <= requiredLevel) return 100; // Meets or exceeds
  if (candidateLevel === requiredLevel + 1) return 70; // One level below
  return 50; // More than one level below
}

/**
 * Calculate ATS score breakdown
 */
export function calculateAtsBreakdown(
  resumeText: string,
  jdKeywords: string[],
  jdResponsibilities: string[],
  requiredEducation: string | null,
  systemRules: ATSSystemRules,
  synonymTolerance: number
): {
  breakdown: ATSBreakdown;
  keywordsFound: string[];
  keywordsMissing: string[];
} {
  const keywordResult = calculateKeywordMatch(
    resumeText,
    jdKeywords,
    synonymTolerance
  );

  const breakdown: ATSBreakdown = {
    keywordMatch: Math.round(
      keywordResult.score * systemRules.keywordDensityMultiplier
    ),
    formatCompliance: calculateFormatCompliance(resumeText, systemRules),
    sectionCompleteness: calculateSectionCompleteness(resumeText),
    experienceRelevance: calculateExperienceRelevance(
      resumeText,
      jdResponsibilities
    ),
    educationMatch: calculateEducationMatch(resumeText, requiredEducation),
  };

  // Cap scores at 100
  breakdown.keywordMatch = Math.min(100, breakdown.keywordMatch);

  return {
    breakdown,
    keywordsFound: keywordResult.found,
    keywordsMissing: keywordResult.missing,
  };
}

/**
 * Calculate final weighted score
 */
export function calculateFinalScore(
  breakdown: ATSBreakdown,
  config: ATSScoreConfig
): number {
  const weightedScore =
    breakdown.keywordMatch * config.keywordMatchWeight +
    breakdown.formatCompliance * config.formatComplianceWeight +
    breakdown.sectionCompleteness * config.sectionCompletenessWeight +
    breakdown.experienceRelevance * config.experienceRelevanceWeight +
    breakdown.educationMatch * config.educationMatchWeight;

  return Math.round(weightedScore);
}

/**
 * Generate recommendations based on score breakdown
 */
export function generateRecommendations(
  breakdown: ATSBreakdown,
  keywordsMissing: string[],
  systemRules: ATSSystemRules
): string[] {
  const recommendations: string[] = [];

  if (breakdown.keywordMatch < 70) {
    recommendations.push(
      `Add missing keywords: ${keywordsMissing.slice(0, 5).join(", ")}`
    );
  }

  if (breakdown.formatCompliance < 80) {
    recommendations.push(
      "Simplify formatting - avoid tables, graphics, and special characters"
    );
  }

  if (breakdown.sectionCompleteness < 80) {
    recommendations.push(
      `Ensure your resume has clear section headers: ${systemRules.headerRequirements.join(", ")}`
    );
  }

  if (breakdown.experienceRelevance < 70) {
    recommendations.push(
      "Align your experience descriptions more closely with the job requirements"
    );
  }

  if (breakdown.educationMatch < 70) {
    recommendations.push(
      "Highlight relevant education, certifications, or equivalent experience"
    );
  }

  return recommendations;
}

/**
 * Main scoring function
 */
export function scoreResume(
  resumeText: string,
  jdKeywords: string[],
  jdResponsibilities: string[],
  requiredEducation: string | null,
  scoringModel: "conservative" | "aggressive",
  atsSystem: AtsSystem
): ScoreResult {
  const config = SCORING_CONFIGS[scoringModel];
  const systemRules = ATS_SYSTEM_RULES[atsSystem];

  const { breakdown, keywordsFound, keywordsMissing } = calculateAtsBreakdown(
    resumeText,
    jdKeywords,
    jdResponsibilities,
    requiredEducation,
    systemRules,
    config.synonymTolerance
  );

  const score = calculateFinalScore(breakdown, config);
  const recommendations = generateRecommendations(
    breakdown,
    keywordsMissing,
    systemRules
  );

  return {
    score,
    breakdown,
    passesThreshold: score >= config.passingThreshold,
    threshold: config.passingThreshold,
    recommendations,
    keywordsFound,
    keywordsMissing,
  };
}
