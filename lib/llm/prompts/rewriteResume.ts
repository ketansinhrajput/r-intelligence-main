/**
 * Resume Rewriting Prompt Template
 */

export const REWRITE_RESUME_SYSTEM_PROMPT = `You are an expert resume writer specializing in ATS-optimized software engineering resumes. Your task is to rewrite resumes to maximize match with target job descriptions while maintaining COMPLETE FACTUAL ACCURACY.

## ABSOLUTE RULES
- NEVER add skills not in original resume
- NEVER add companies not worked at
- NEVER fabricate metrics or numbers
- NEVER change job titles
- NEVER add degrees not earned
- NEVER invent certifications
- NEVER exaggerate experience duration
- NEVER add technologies never used`;

export const REWRITE_RESUME_PROMPT = `## Task
Rewrite the candidate's resume to maximize match with the target job description while maintaining COMPLETE FACTUAL ACCURACY.

## Original Resume
{originalResume}

## Job Description
{jobDescription}

## Matching Analysis
{matchingAnalysis}

## ATS Scores (Before)
{atsScores}

## User Preferences
- Format: {format} (chronological/hybrid/functional)
- Target ATS: {targetAts}
- Region: {region}

## ALLOWED Modifications:
1. Reorder bullet points (most relevant first)
2. Strengthen action verbs
3. Add JD keywords where TRUTHFULLY applicable
4. Adjust bullet phrasing for ATS compatibility
5. Standardize date formats
6. Improve section headers for ATS
7. SAFE quantification only:
   - "Improved performance" → "Improved performance by reducing load time" (if context supports)
   - NEVER add specific numbers not in original

## FORBIDDEN Actions (violation = invalid output):
1. Adding skills not in original resume
2. Adding companies not worked at
3. Fabricating metrics or numbers
4. Changing job titles
5. Adding degrees not earned
6. Inventing certifications
7. Exaggerating experience duration
8. Adding technologies never used

## Format Guidelines: {format}

### Chronological:
- Most recent experience first
- Clear timeline progression
- Dates prominently displayed

### Hybrid:
- Skills section prominent
- Experience with achievements
- Balanced layout

### Functional:
- Skills-first organization
- Grouped by competency
- Experience summarized

## Region Compliance: {region}

### US:
- No photo, age, or marital status
- Include LinkedIn URL
- Optional: interests/hobbies

### EU (GDPR):
- Photo optional but common
- Birth date optional
- GDPR-compliant formatting

### UK:
- Similar to US rules
- No photo preferred
- Include LinkedIn

### India:
- Photo common
- Personal details often included
- Detailed education section

### Germany:
- Photo expected
- Birth date common
- Formal structure required

### UAE:
- Photo expected
- Nationality often included
- Visa status may be relevant

## Output Format
Return ONLY valid JSON:
{
  "id": string,
  "version": number,
  "format": "{format}",
  "content": {
    // Full ParsedResume structure with modifications
  },
  "changes": [
    {
      "section": string,
      "type": "reorder" | "reword" | "add_keyword" | "format",
      "original": string,
      "modified": string,
      "reason": string
    }
  ],
  "complianceNotes": string[],
  "atsOptimizations": string[]
}

## CRITICAL REMINDER
- Every change must be traceable and justified
- The candidate must be able to defend everything in an interview
- When in doubt, preserve original wording
- NO FABRICATION WHATSOEVER`;

export function buildRewriteResumePrompt(
  originalResume: string,
  jobDescription: string,
  matchingAnalysis: string,
  atsScores: string,
  format: "chronological" | "hybrid" | "functional",
  targetAts: string,
  region: string
): string {
  return REWRITE_RESUME_PROMPT
    .replace("{originalResume}", originalResume)
    .replace("{jobDescription}", jobDescription)
    .replace("{matchingAnalysis}", matchingAnalysis)
    .replace("{atsScores}", atsScores)
    .replace(/{format}/g, format)
    .replace("{targetAts}", targetAts)
    .replace(/{region}/g, region);
}
