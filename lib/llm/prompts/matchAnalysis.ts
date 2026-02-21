/**
 * Resume-JD Matching Analysis Prompt Template
 */

export const MATCH_ANALYSIS_SYSTEM_PROMPT = `You are a senior technical recruiter and hiring manager with deep software engineering expertise. Your task is to perform comprehensive matching analysis between candidates and job descriptions.

## Critical Rules
- Base ALL assessments on explicit resume content
- Never assume skills not documented
- Be generous with transferable skill recognition
- Explain match reasoning for transparency
- Overall score must be defensible`;

export const MATCH_ANALYSIS_PROMPT = `## Task
Perform comprehensive matching analysis between the candidate's resume and the job description.

## Candidate Resume
{parsedResume}

## Job Description
{parsedJd}

## Analysis Requirements

### 1. Skill Matching
For EACH required skill in the JD:
- Search resume for exact matches
- Search for equivalent/related skills
- Check experience bullets for skill demonstration
- Classify match strength: strong (explicit + demonstrated), moderate (mentioned), weak (transferable only)

For missing skills:
- Only flag as missing if NO evidence exists
- Suggest transferable skills if applicable
- Note importance level from JD

### 2. Experience Matching
- Calculate total relevant years of experience
- Match past roles to JD responsibilities
- Score relevance of each position (0-1)
- Note any experience gaps

### 3. Education Matching
- Compare required vs candidate education
- Note relevant coursework if junior role
- Flag only if requirement is strict

### 4. Role Alignment
- Compare job titles for seniority alignment
- Assess if lateral move, promotion, or career change
- Flag potential overqualification or underqualification

### 5. Overall Score Calculation
Weight factors:
- Skill match: 40%
- Experience relevance: 30%
- Role alignment: 20%
- Education: 10%

## Output Format
Return ONLY valid JSON:
{
  "overallScore": number (0-100),
  "explanation": string,
  "skillMatch": {
    "matchedSkills": [
      {
        "skill": string,
        "jdRequirement": string,
        "resumeEvidence": string,
        "strength": "strong" | "moderate" | "weak"
      }
    ],
    "missingSkills": [
      {
        "skill": string,
        "jdRequirement": string,
        "importance": "required" | "preferred" | "nice_to_have",
        "suggestion": string | null
      }
    ],
    "transferableSkills": [
      {
        "candidateSkill": string,
        "targetSkill": string,
        "transferability": number (0-1),
        "justification": string
      }
    ],
    "totalRequired": number,
    "totalMatched": number,
    "matchPercentage": number
  },
  "experienceMatch": {
    "yearsRequired": number | null,
    "yearsCandidate": number,
    "matchStatus": "exceeds" | "meets" | "below" | "unknown",
    "relevantExperiences": [
      {
        "experienceId": string,
        "company": string,
        "title": string,
        "relevanceScore": number (0-1),
        "matchingResponsibilities": string[]
      }
    ]
  },
  "educationMatch": {
    "required": string | null,
    "candidate": string,
    "matchStatus": "exceeds" | "meets" | "below" | "not_required",
    "notes": string | null
  },
  "roleAlignment": {
    "titleMatch": {
      "jdTitle": string,
      "resumeTitle": string,
      "alignmentScore": number (0-1),
      "isLateralMove": boolean,
      "isPromotion": boolean,
      "isCareerChange": boolean
    },
    "seniorityMatch": {
      "jdLevel": string,
      "candidateLevel": string,
      "matchStatus": "over_qualified" | "qualified" | "under_qualified" | "unknown"
    }
  }
}`;

export function buildMatchAnalysisPrompt(
  parsedResume: string,
  parsedJd: string
): string {
  return MATCH_ANALYSIS_PROMPT
    .replace("{parsedResume}", parsedResume)
    .replace("{parsedJd}", parsedJd);
}
