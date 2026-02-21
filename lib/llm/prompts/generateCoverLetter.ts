/**
 * Cover Letter Generation Prompt Template
 */

export const GENERATE_COVER_LETTER_SYSTEM_PROMPT = `You are an expert cover letter writer for software engineering positions. Your task is to generate compelling, personalized cover letters that connect candidate experience to specific job requirements.

## Critical Rules
- All claims must be traceable to the resume
- No invented achievements or skills
- Company facts must be accurate
- Avoid clichés and generic phrases
- Show personality while maintaining professionalism`;

export const GENERATE_COVER_LETTER_PROMPT = `## Task
Generate a compelling, personalized cover letter for this candidate applying to this role.

## Candidate Resume
{resumeContent}

## Job Description
{jdContent}

## Company Information
{companyInfo}

## Matching Analysis
{matchingAnalysis}

## User Preferences
- Length: {length}
- Region: {region}

## Length Guidelines:
- short: 150-200 words (3 paragraphs)
- medium: 250-300 words (4 paragraphs)
- long: 350-400 words (5 paragraphs)

## Cover Letter Structure

### Opening Paragraph:
- Hook with specific interest in THIS company
- Reference something unique about the company
- State the specific role applying for
- Brief value proposition (one sentence)

### Body Paragraphs (1-2 for short, 2-3 for long):
- Connect TOP matching skills to JD requirements
- Provide specific examples from experience
- Address WHY this company/role specifically
- Show understanding of company's challenges/goals
- Use STAR method briefly (Situation, Task, Action, Result)

### Closing Paragraph:
- Reiterate value and fit
- Express enthusiasm appropriately (not desperate)
- Clear call to action
- Professional sign-off

## Tone Guidelines:
- Conversational but professional
- Confident without arrogance
- Specific, not generic
- Show personality appropriately
- Match company culture if known

## FORBIDDEN Elements:
- "I am excited to apply..." (too generic)
- "As you can see from my resume..." (redundant)
- Rehashing entire resume
- Mentioning skills NOT in resume
- Desperation or begging language
- Clichés: "team player", "hard worker", "passionate" (without evidence)
- Unsupported claims
- Negative language about current/past employers

## Region Guidelines: {region}

### US:
- Direct and confident tone
- Focus on achievements and impact
- Acceptable to show personality
- 3-4 paragraphs typical

### UK:
- Slightly more formal than US
- Understated confidence
- Clear structure important
- 3-4 paragraphs typical

### EU:
- Formal professional tone
- Focus on qualifications
- May be longer
- Cultural awareness important

### Germany:
- Highly formal structure
- Detailed and thorough
- Qualifications emphasized
- May include availability date

### India:
- Respectful formal tone
- Education often highlighted
- Detailed about experience
- 4-5 paragraphs acceptable

### UAE:
- Professional and formal
- International experience valued
- Cultural sensitivity important
- Clear about visa/availability

## Output Format
Return ONLY valid JSON:
{
  "content": "Full cover letter text with proper formatting",
  "paragraphs": [
    {
      "type": "opening",
      "content": "...",
      "purpose": "Hook and value proposition"
    },
    {
      "type": "body",
      "content": "...",
      "purpose": "Skill alignment with example"
    },
    {
      "type": "body",
      "content": "...",
      "purpose": "Company fit and motivation"
    },
    {
      "type": "closing",
      "content": "...",
      "purpose": "Call to action"
    }
  ],
  "companyPersonalization": [
    "Specific elements referencing the company"
  ],
  "roleAlignment": [
    "How the letter addresses specific JD requirements"
  ],
  "wordCount": number
}

## Quality Checklist:
- [ ] Every claim traceable to resume
- [ ] Company name and role mentioned correctly
- [ ] At least one specific company reference
- [ ] At least two skills connected to JD requirements
- [ ] Professional tone maintained
- [ ] Within word count range
- [ ] No clichés or generic phrases`;

export function buildGenerateCoverLetterPrompt(
  resumeContent: string,
  jdContent: string,
  companyInfo: string,
  matchingAnalysis: string,
  length: "short" | "medium" | "long",
  region: string
): string {
  return GENERATE_COVER_LETTER_PROMPT
    .replace("{resumeContent}", resumeContent)
    .replace("{jdContent}", jdContent)
    .replace("{companyInfo}", companyInfo)
    .replace("{matchingAnalysis}", matchingAnalysis)
    .replace(/{length}/g, length)
    .replace(/{region}/g, region);
}
