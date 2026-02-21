/**
 * Resume Parsing Prompt Template
 */

export const PARSE_RESUME_SYSTEM_PROMPT = `You are an expert resume parser specializing in software engineering resumes. Your task is to extract ALL information accurately into a structured JSON format.

## Critical Rules
- Extract ONLY what is explicitly stated in the resume
- Do NOT infer or fabricate any information
- Use null for missing fields
- Preserve original wording in bullet points
- Parse dates as "YYYY-MM" or "YYYY" format
- For current positions, set endDate to null and current to true`;

export const PARSE_RESUME_PROMPT = `## Task
Parse the following resume text into a structured JSON format.

## Input Resume Text
{resumeText}

## Extraction Guidelines

### Contact Information
- Extract name, email, phone, location
- Identify LinkedIn, GitHub, portfolio URLs
- If information is missing, set to null

### Work Experience
- Extract company name, job title, dates, location
- Parse each bullet point separately
- Identify action verbs and metrics in bullets
- Extract technologies mentioned per role
- Mark current positions (endDate = null with current = true)

### Skills
- Categorize into: Languages, Frameworks, Databases, Tools, Cloud, etc.
- Do NOT infer proficiency unless explicitly stated
- Extract skills from both skills section AND experience bullets

### Education
- Extract institution, degree, field, dates
- Note GPA only if explicitly stated
- Extract honors/awards mentioned

### Certifications
- Extract name, issuer, date, credential ID if present

### Projects
- Extract name, description, technologies, URLs

## Output Format
Return ONLY valid JSON with this structure:
{
  "metadata": {
    "confidence": number (0-1)
  },
  "contact": {
    "name": string,
    "email": string | null,
    "phone": string | null,
    "location": string | null,
    "linkedin": string | null,
    "github": string | null,
    "portfolio": string | null
  },
  "summary": string | null,
  "experience": [
    {
      "id": string,
      "company": string,
      "title": string,
      "location": string | null,
      "startDate": string | null,
      "endDate": string | null,
      "current": boolean,
      "bullets": [
        {
          "id": string,
          "original": string,
          "metrics": [
            {
              "value": string,
              "type": "percentage" | "number" | "currency" | "time" | "scale",
              "context": string,
              "isInferred": boolean
            }
          ],
          "actionVerb": string | null,
          "impactLevel": "high" | "medium" | "low"
        }
      ],
      "technologies": string[]
    }
  ],
  "education": [
    {
      "id": string,
      "institution": string,
      "degree": string,
      "field": string | null,
      "gpa": string | null,
      "startDate": string | null,
      "endDate": string | null,
      "honors": string[]
    }
  ],
  "skills": [
    {
      "category": string,
      "skills": [
        {
          "name": string,
          "proficiency": "expert" | "advanced" | "intermediate" | "beginner" | null,
          "yearsOfExperience": number | null,
          "lastUsed": string | null
        }
      ]
    }
  ],
  "certifications": [
    {
      "name": string,
      "issuer": string,
      "date": string | null,
      "expirationDate": string | null,
      "credentialId": string | null
    }
  ],
  "projects": [
    {
      "id": string,
      "name": string,
      "description": string,
      "technologies": string[],
      "url": string | null,
      "startDate": string | null,
      "endDate": string | null
    }
  ],
  "awards": [
    {
      "name": string,
      "issuer": string,
      "date": string | null,
      "description": string | null
    }
  ],
  "languages": [
    {
      "language": string,
      "proficiency": "native" | "fluent" | "professional" | "conversational" | "basic"
    }
  ]
}`;

export function buildParseResumePrompt(resumeText: string): string {
  return PARSE_RESUME_PROMPT.replace("{resumeText}", resumeText);
}
