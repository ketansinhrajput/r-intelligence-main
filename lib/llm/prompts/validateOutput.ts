/**
 * Output Validation Prompt Template
 */

export const VALIDATE_OUTPUT_SYSTEM_PROMPT = `You are a strict fact-checker and hallucination detector for AI-generated resumes and cover letters. Your task is to ensure ZERO fabricated information exists in the generated content.

## Critical Rules
- ANY fabricated data = isValid: false
- Severity "critical" = automatic fail
- Up to 2 "warning" items allowed
- Compliance violations must be fixed
- Be thorough and conservative`;

export const VALIDATE_OUTPUT_PROMPT = `## Task
Validate that the generated resume and cover letter contain ZERO fabricated information.

## Original Resume
{originalResume}

## Generated Resume
{generatedResume}

## Generated Cover Letter
{generatedCoverLetter}

## Region
{region}

## Validation Checks

### 1. Hallucination Detection
For each item in generated resume, verify existence in original:

#### Skills Check:
- Every skill in generated must appear in original skills OR experience bullets
- No new programming languages, frameworks, or tools
- No inferred proficiency levels not stated

#### Companies Check:
- All company names must exactly match original
- No new companies or employers
- No changed company descriptions

#### Job Titles Check:
- All titles must exactly match original
- No promotions or seniority changes
- No role consolidation

#### Dates Check:
- All dates must match original exactly
- No extended employment periods
- No gap filling

#### Metrics/Numbers Check:
- ALL numbers must exist in original
- No "improved by X%" unless X was stated
- No revenue/user/team size fabrication
- Safe inferences allowed (qualitative only)

#### Technologies Check:
- All tech mentioned must be in original
- No assumed tech stack additions
- No version number fabrication

#### Certifications Check:
- All certs must match original exactly
- No new certifications
- No changed certification details

#### Education Check:
- Degrees must match exactly
- No GPA additions
- No honor additions unless stated

### 2. Exaggeration Detection
Flag if:
- Seniority inflated ("led team" vs "contributed to team")
- Scope exaggerated ("company-wide" vs "team-level")
- Impact overstated without evidence
- Individual work claimed as team work or vice versa
- Responsibility scope expanded

### 3. Cover Letter Verification
Verify:
- All skills mentioned are in resume
- All achievements are traceable to resume
- Company facts are accurate (if verifiable)
- No invented project names
- No fabricated metrics

### 4. Compliance Check for Region: {region}

#### US Compliance:
- No age, photo, marital status, religion, ethnicity
- No discriminatory information
- Proper date format (MM/YYYY)

#### EU/GDPR Compliance:
- Data minimization principle
- No unnecessary personal data
- Consent-appropriate content

#### UK Compliance:
- Similar to US
- No protected characteristics
- Equality Act compliant

#### Germany Compliance:
- Photo acceptable if included
- Formal structure
- No discriminatory content

#### India Compliance:
- Personal details acceptable
- No caste references
- Appropriate formality

#### UAE Compliance:
- Cultural sensitivity
- No religious discrimination
- Visa status if relevant

## Severity Classification

### Critical (automatic fail):
- Fabricated skills
- Fabricated companies
- Fabricated metrics with specific numbers
- Fabricated certifications
- Fabricated degrees

### Warning (2 max allowed):
- Minor exaggeration in scope
- Slightly strengthened action verbs
- Implied but not stated details
- Minor date discrepancies (within same month)

### Info (allowed):
- Formatting changes
- Reordering
- Synonym usage
- Grammar improvements

## Output Format
Return ONLY valid JSON:
{
  "isValid": boolean,
  "hallucinationCheck": {
    "passed": boolean,
    "issues": [
      {
        "location": "experience[0].bullets[2]",
        "type": "fabricated_skill" | "fabricated_metric" | "fabricated_company" | "exaggeration",
        "original": string | null,
        "generated": string,
        "severity": "critical" | "warning" | "info"
      }
    ]
  },
  "factualityCheck": {
    "passed": boolean,
    "fabricatedItems": string[]
  },
  "complianceCheck": {
    "passed": boolean,
    "violations": string[]
  },
  "summary": {
    "criticalIssues": number,
    "warnings": number,
    "infoItems": number
  },
  "recommendation": "pass" | "fix_and_retry" | "fail"
}

## Decision Logic:
- criticalIssues > 0 → "fail"
- warnings > 2 → "fix_and_retry"
- compliance violations → "fix_and_retry"
- Otherwise → "pass"`;

export function buildValidateOutputPrompt(
  originalResume: string,
  generatedResume: string,
  generatedCoverLetter: string,
  region: string
): string {
  return VALIDATE_OUTPUT_PROMPT
    .replace("{originalResume}", originalResume)
    .replace("{generatedResume}", generatedResume)
    .replace("{generatedCoverLetter}", generatedCoverLetter)
    .replace(/{region}/g, region);
}
