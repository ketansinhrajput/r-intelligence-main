/**
 * Job Description Parsing Prompt Template
 */

export const PARSE_JD_SYSTEM_PROMPT = `You are an expert job description analyzer for software engineering roles. Your task is to extract all relevant information into a structured format for resume matching.

## Critical Rules
- Mark missing information as null or "not_specified"
- Do NOT infer salary if not explicitly stated
- Distinguish between required vs preferred qualifications carefully
- Preserve exact skill names as written`;

export const PARSE_JD_PROMPT = `## Task
Parse the following job description into a structured format.

## Job Description Text
{jdText}

## Source Information
Source: {source}
URL: {sourceUrl}

## Extraction Guidelines

### Basic Information
- Extract job title, company name
- Determine company size/stage if mentioned
- Extract industry context

### Location Analysis
- Determine: remote / hybrid / onsite / not_specified
- Extract specific locations mentioned
- Note relocation assistance if mentioned
- Note visa sponsorship if mentioned

### Seniority Assessment
- Classify level: intern, entry, mid, senior, staff, principal, director, vp, c-level
- Extract years of experience requirements (min/max)

### Compensation
- Extract salary range if mentioned (with currency)
- Note equity/bonus mentions
- Mark as not specified if absent

### Requirements Classification
Separate into: required, preferred, nice_to_have
For each requirement, extract:
- The skill/qualification keywords
- Years of experience needed
- Category: skill, experience, education, certification, soft_skill

### Responsibilities
- Extract all job responsibilities as a list

### Benefits
- Extract all benefits and perks mentioned

## Output Format
Return ONLY valid JSON with this structure:
{
  "metadata": {
    "source": "url" | "pdf",
    "sourceUrl": string | null,
    "company": string,
    "confidence": number (0-1)
  },
  "title": string,
  "company": {
    "name": string,
    "industry": string | null,
    "size": "startup" | "mid" | "enterprise" | null,
    "description": string | null
  },
  "location": {
    "type": "remote" | "hybrid" | "onsite" | "not_specified",
    "primary": string | null,
    "additionalLocations": string[],
    "relocationOffered": boolean | null,
    "visaSponsorship": boolean | null
  },
  "seniority": {
    "level": "intern" | "entry" | "mid" | "senior" | "staff" | "principal" | "director" | "vp" | "c-level",
    "yearsExperienceMin": number | null,
    "yearsExperienceMax": number | null
  },
  "compensation": {
    "specified": boolean,
    "salaryMin": number | null,
    "salaryMax": number | null,
    "currency": string | null,
    "type": "annual" | "hourly" | "contract" | null,
    "equity": boolean | null,
    "bonus": boolean | null
  },
  "requirements": {
    "required": [
      {
        "id": string,
        "text": string,
        "category": "skill" | "experience" | "education" | "certification" | "soft_skill" | "other",
        "skills": string[],
        "yearsRequired": number | null
      }
    ],
    "preferred": [...],
    "niceToHave": [...]
  },
  "responsibilities": string[],
  "benefits": string[],
  "applicationDeadline": string | null
}`;

export function buildParseJdPrompt(
  jdText: string,
  source: "url" | "pdf",
  sourceUrl: string | null
): string {
  return PARSE_JD_PROMPT
    .replace("{jdText}", jdText)
    .replace("{source}", source)
    .replace("{sourceUrl}", sourceUrl || "N/A");
}
