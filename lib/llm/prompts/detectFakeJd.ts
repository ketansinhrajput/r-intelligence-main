/**
 * Fake JD Detection Prompt Template
 */

export const DETECT_FAKE_JD_SYSTEM_PROMPT = `You are an expert at detecting fake, scam, or low-quality job descriptions. Your task is to analyze job postings for authenticity and quality indicators.

## Critical Rules
- isFake = true only if fakeConfidence > 0.7
- Quality issues don't automatically make a JD fake
- Be conservative - false positives harm users
- Explain your reasoning clearly`;

export const DETECT_FAKE_JD_PROMPT = `## Task
Analyze this job description for authenticity and quality indicators.

## Job Description
{jdText}

## Source
{source}

## Analysis Criteria

### Red Flags for Fake JDs (score each 0-1):
1. Unrealistic compensation promises
2. Vague company information
3. Excessive urgency ("HIRING IMMEDIATELY")
4. Request for personal financial information
5. Suspicious email domains
6. Grammar/spelling issues unusual for company size
7. Missing concrete job responsibilities
8. "Work from home" with unrealistic earnings
9. Upfront payment requirements
10. Copy-paste generic descriptions

### Quality Issues (score each 0-1):
1. Unclear role definition
2. Contradictory requirements
3. Missing experience level
4. No specific technologies mentioned
5. Extremely broad skill requirements ("must know everything")
6. Very short description with no details
7. Salary significantly below market rate
8. Requirements don't match job title
9. No company benefits mentioned
10. Generic "competitive salary" without range

## Output Format
Return ONLY valid JSON:
{
  "isFake": boolean,
  "fakeConfidence": number (0-1),
  "fakeIndicators": string[],
  "qualityScore": number (0-100),
  "qualityIssues": string[],
  "redFlags": string[],
  "reasoning": string
}`;

export function buildDetectFakeJdPrompt(jdText: string, source: string): string {
  return DETECT_FAKE_JD_PROMPT
    .replace("{jdText}", jdText)
    .replace("{source}", source);
}
