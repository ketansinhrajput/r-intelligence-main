/**
 * ATS Scoring Prompt Template
 */

export const ATS_SCORING_SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) scoring algorithm. Your task is to evaluate resumes against job descriptions using specific scoring methodologies.

## Critical Rules
- Be consistent with scoring methodology
- Document reasoning for each score component
- Identify specific keywords found and missing
- Provide actionable recommendations`;

export const ATS_SCORING_PROMPT = `## Task
Score this resume against the job description using {scoringModel} methodology for {atsSystem} ATS.

## Resume Content
{resumeContent}

## Job Description
{jdContent}

## Scoring Model: {scoringModel}

### Conservative Model Rules:
- Only exact keyword matches count
- Synonyms scored at 50%
- Strict format requirements
- Penalize missing sections heavily
- Threshold: 75/100 to pass

### Aggressive Model Rules:
- Semantic keyword matching allowed
- Synonyms scored at 80%
- Flexible format tolerance
- Partial credit for missing sections
- Threshold: 60/100 to pass

## ATS System: {atsSystem}

### Workday Specifics:
- Heavy emphasis on keyword density
- Penalizes creative formatting
- Prefers chronological format
- Section headers must be standard

### Greenhouse Specifics:
- Balanced keyword and context
- Moderate format flexibility
- Skills section weighted highly
- Accepts various formats

### Lever Specifics:
- More semantic understanding
- Higher format tolerance
- Experience detail valued
- Links/URLs acceptable

### Generic ATS:
- Use average of all rules
- Standard keyword matching
- Basic format compliance

## Scoring Breakdown (each 0-100):
1. Keyword Match Score: % of required keywords found
2. Format Compliance: Standard sections, no tables/graphics
3. Section Completeness: All expected sections present
4. Experience Relevance: Role match to requirements
5. Education Match: Meets stated requirements

## Output Format
Return ONLY valid JSON:
{
  "score": number (0-100),
  "model": "{scoringModel}",
  "breakdown": {
    "keywordMatch": number (0-100),
    "formatCompliance": number (0-100),
    "sectionCompleteness": number (0-100),
    "experienceRelevance": number (0-100),
    "educationMatch": number (0-100)
  },
  "passesThreshold": boolean,
  "threshold": number,
  "recommendations": string[],
  "keywordsFound": string[],
  "keywordsMissing": string[]
}`;

export function buildAtsScoringPrompt(
  resumeContent: string,
  jdContent: string,
  scoringModel: "conservative" | "aggressive",
  atsSystem: string
): string {
  return ATS_SCORING_PROMPT
    .replace(/{scoringModel}/g, scoringModel)
    .replace(/{atsSystem}/g, atsSystem)
    .replace("{resumeContent}", resumeContent)
    .replace("{jdContent}", jdContent);
}
