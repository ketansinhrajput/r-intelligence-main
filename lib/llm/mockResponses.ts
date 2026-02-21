/**
 * Mock LLM Responses
 * Provides realistic mock responses for development and testing
 */

import type { TaskType } from "./models";

/**
 * Get a mock response for a given task
 */
export function getMockResponse(task: TaskType, prompt: string): string {
  console.log(`[getMockResponse] Generating mock for task: ${task}`);

  switch (task) {
    case "parsing":
      if (prompt.includes("resume") || prompt.includes("Resume")) {
        return JSON.stringify(getMockParsedResume(prompt));
      }
      return JSON.stringify(getMockParsedJd(prompt));

    case "analysis":
      if (prompt.toLowerCase().includes("fake") || prompt.toLowerCase().includes("scam")) {
        return JSON.stringify(getMockFakeJdAnalysis());
      }
      if (prompt.toLowerCase().includes("multi-role") || prompt.toLowerCase().includes("split")) {
        return JSON.stringify(getMockMultiRoleAnalysis());
      }
      return JSON.stringify(getMockAnalysis());

    case "matching":
      return JSON.stringify(getMockMatchingAnalysis());

    case "scoring":
      return JSON.stringify(getMockAtsScore(prompt));

    case "generation":
      if (prompt.toLowerCase().includes("cover letter")) {
        return JSON.stringify(getMockCoverLetter());
      }
      return JSON.stringify(getMockGeneratedResume());

    case "validation":
      return JSON.stringify(getMockValidation());

    default:
      return JSON.stringify({ message: "Mock response" });
  }
}

function getMockParsedResume(prompt: string): object {
  // Extract some info from the prompt if possible
  const nameMatch = prompt.match(/(?:name|Name)[\s:]+([A-Z][a-z]+ [A-Z][a-z]+)/);
  const emailMatch = prompt.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);

  return {
    contact: {
      name: nameMatch?.[1] || "John Doe",
      email: emailMatch?.[1] || "john.doe@email.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/johndoe",
      github: "github.com/johndoe",
      portfolio: null,
    },
    summary: "Experienced software engineer with 5+ years of experience in full-stack development, specializing in React, TypeScript, and Node.js. Passionate about building scalable applications and mentoring junior developers.",
    experience: [
      {
        id: "exp-1",
        company: "Tech Corp Inc",
        title: "Senior Software Engineer",
        location: "San Francisco, CA",
        startDate: "2021-03",
        endDate: null,
        current: true,
        bullets: [
          {
            id: "bullet-1",
            original: "Led development of microservices architecture serving 1M+ daily users",
            metrics: [{ value: "1M+", type: "scale", context: "daily users", isInferred: false }],
            actionVerb: "Led",
            impactLevel: "high",
          },
          {
            id: "bullet-2",
            original: "Reduced API response time by 40% through optimization",
            metrics: [{ value: "40%", type: "percentage", context: "response time reduction", isInferred: false }],
            actionVerb: "Reduced",
            impactLevel: "high",
          },
          {
            id: "bullet-3",
            original: "Mentored 5 junior developers and conducted code reviews",
            metrics: [{ value: "5", type: "number", context: "developers mentored", isInferred: false }],
            actionVerb: "Mentored",
            impactLevel: "medium",
          },
        ],
        technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker"],
      },
      {
        id: "exp-2",
        company: "StartupXYZ",
        title: "Software Engineer",
        location: "Remote",
        startDate: "2019-01",
        endDate: "2021-02",
        current: false,
        bullets: [
          {
            id: "bullet-4",
            original: "Built React dashboard used by 500+ enterprise customers",
            metrics: [{ value: "500+", type: "number", context: "customers", isInferred: false }],
            actionVerb: "Built",
            impactLevel: "high",
          },
          {
            id: "bullet-5",
            original: "Implemented CI/CD pipelines reducing deployment time by 60%",
            metrics: [{ value: "60%", type: "percentage", context: "deployment time reduction", isInferred: false }],
            actionVerb: "Implemented",
            impactLevel: "medium",
          },
        ],
        technologies: ["React", "JavaScript", "Python", "AWS Lambda", "Jenkins"],
      },
    ],
    education: [
      {
        id: "edu-1",
        institution: "University of California, Berkeley",
        degree: "Bachelor of Science",
        field: "Computer Science",
        gpa: "3.7",
        startDate: "2015",
        endDate: "2019",
        honors: ["Magna Cum Laude", "Dean's List"],
      },
    ],
    skills: [
      {
        category: "Languages",
        skills: [
          { name: "TypeScript", proficiency: "expert", yearsOfExperience: 4, lastUsed: "2024" },
          { name: "JavaScript", proficiency: "expert", yearsOfExperience: 6, lastUsed: "2024" },
          { name: "Python", proficiency: "advanced", yearsOfExperience: 3, lastUsed: "2023" },
          { name: "Go", proficiency: "intermediate", yearsOfExperience: 1, lastUsed: "2023" },
        ],
      },
      {
        category: "Frameworks",
        skills: [
          { name: "React", proficiency: "expert", yearsOfExperience: 5, lastUsed: "2024" },
          { name: "Node.js", proficiency: "expert", yearsOfExperience: 4, lastUsed: "2024" },
          { name: "Next.js", proficiency: "advanced", yearsOfExperience: 2, lastUsed: "2024" },
          { name: "Express", proficiency: "advanced", yearsOfExperience: 4, lastUsed: "2024" },
        ],
      },
      {
        category: "Databases",
        skills: [
          { name: "PostgreSQL", proficiency: "advanced", yearsOfExperience: 4, lastUsed: "2024" },
          { name: "MongoDB", proficiency: "intermediate", yearsOfExperience: 2, lastUsed: "2023" },
          { name: "Redis", proficiency: "intermediate", yearsOfExperience: 2, lastUsed: "2024" },
        ],
      },
      {
        category: "Cloud & DevOps",
        skills: [
          { name: "AWS", proficiency: "advanced", yearsOfExperience: 3, lastUsed: "2024" },
          { name: "Docker", proficiency: "advanced", yearsOfExperience: 3, lastUsed: "2024" },
          { name: "Kubernetes", proficiency: "intermediate", yearsOfExperience: 1, lastUsed: "2023" },
          { name: "CI/CD", proficiency: "advanced", yearsOfExperience: 4, lastUsed: "2024" },
        ],
      },
    ],
    certifications: [
      {
        name: "AWS Solutions Architect Associate",
        issuer: "Amazon Web Services",
        date: "2023-06",
        expirationDate: "2026-06",
        credentialId: "AWS-SAA-123456",
      },
    ],
    projects: [
      {
        id: "proj-1",
        name: "Open Source CLI Tool",
        description: "Built a popular command-line tool for developers with 1000+ GitHub stars",
        technologies: ["Go", "Cobra", "GitHub Actions"],
        url: "https://github.com/johndoe/cli-tool",
        startDate: "2022",
        endDate: "2023",
      },
    ],
    awards: [],
    languages: [
      { language: "English", proficiency: "native" },
      { language: "Spanish", proficiency: "conversational" },
    ],
  };
}

function getMockParsedJd(prompt: string): object {
  return {
    title: "Senior Software Engineer",
    company: {
      name: "TechCo Inc",
      industry: "Technology",
      size: "mid",
      description: "A leading technology company focused on innovative solutions",
    },
    location: {
      type: "hybrid",
      primary: "San Francisco, CA",
      additionalLocations: ["New York, NY"],
      relocationOffered: true,
      visaSponsorship: true,
    },
    seniority: {
      level: "senior",
      yearsExperienceMin: 5,
      yearsExperienceMax: 10,
    },
    compensation: {
      specified: true,
      salaryMin: 150000,
      salaryMax: 200000,
      currency: "USD",
      type: "annual",
      equity: true,
      bonus: true,
    },
    requirements: {
      required: [
        { id: "req-1", text: "5+ years of software engineering experience", category: "experience", skills: [], yearsRequired: 5 },
        { id: "req-2", text: "Strong proficiency in React and TypeScript", category: "skill", skills: ["React", "TypeScript"], yearsRequired: 3 },
        { id: "req-3", text: "Experience with Node.js and backend development", category: "skill", skills: ["Node.js"], yearsRequired: 2 },
        { id: "req-4", text: "Experience with cloud platforms (AWS, GCP, or Azure)", category: "skill", skills: ["AWS", "GCP", "Azure"], yearsRequired: 2 },
        { id: "req-5", text: "Bachelor's degree in Computer Science or related field", category: "education", skills: [], yearsRequired: null },
      ],
      preferred: [
        { id: "pref-1", text: "Experience with Kubernetes and container orchestration", category: "skill", skills: ["Kubernetes", "Docker"], yearsRequired: null },
        { id: "pref-2", text: "Experience with microservices architecture", category: "skill", skills: ["microservices"], yearsRequired: null },
        { id: "pref-3", text: "Leadership or mentoring experience", category: "soft_skill", skills: [], yearsRequired: null },
      ],
      niceToHave: [
        { id: "nice-1", text: "Contributions to open source projects", category: "other", skills: [], yearsRequired: null },
        { id: "nice-2", text: "Experience with GraphQL", category: "skill", skills: ["GraphQL"], yearsRequired: null },
      ],
    },
    responsibilities: [
      "Design and implement scalable backend services",
      "Lead technical architecture decisions",
      "Mentor junior engineers and conduct code reviews",
      "Collaborate with product and design teams",
      "Participate in on-call rotation",
    ],
    benefits: [
      "Competitive salary and equity",
      "Health, dental, and vision insurance",
      "401(k) with company match",
      "Unlimited PTO",
      "Remote work flexibility",
      "Professional development budget",
    ],
    applicationDeadline: null,
    qualityAssessment: {
      isFake: false,
      fakeConfidence: 0.05,
      fakeIndicators: [],
      qualityScore: 85,
      qualityIssues: [],
      redFlags: [],
    },
    multiRoleDetection: {
      isMultiRole: false,
      roles: [{ title: "Senior Software Engineer", confidence: 0.95, matchingRequirements: [] }],
      primaryRole: "Senior Software Engineer",
    },
  };
}

function getMockFakeJdAnalysis(): object {
  return {
    isFake: false,
    fakeConfidence: 0.1,
    fakeIndicators: [],
    qualityScore: 82,
    qualityIssues: ["Salary range could be more specific"],
    redFlags: [],
    reasoning: "This appears to be a legitimate job posting from an established company with clear requirements and benefits.",
  };
}

function getMockMultiRoleAnalysis(): object {
  return {
    isMultiRole: false,
    roles: [
      {
        title: "Senior Software Engineer",
        confidence: 0.95,
        matchingRequirements: ["Full-stack development", "Team leadership"],
      },
    ],
    primaryRole: "Senior Software Engineer",
    reasoning: "The job description focuses on a single senior engineering role with clear responsibilities.",
  };
}

function getMockAnalysis(): object {
  return {
    summary: "Strong match for the position",
    confidence: 0.85,
  };
}

function getMockMatchingAnalysis(): object {
  return {
    overallScore: 78,
    explanation: "Strong candidate with relevant technical skills and experience. Some gaps in specific technologies but transferable skills are present.",
    skillMatch: {
      matchedSkills: [
        { skill: "React", jdRequirement: "Strong proficiency in React", resumeEvidence: "5 years of React experience", strength: "strong" },
        { skill: "TypeScript", jdRequirement: "Strong proficiency in TypeScript", resumeEvidence: "4 years of TypeScript experience", strength: "strong" },
        { skill: "Node.js", jdRequirement: "Experience with Node.js", resumeEvidence: "4 years building backend services", strength: "strong" },
        { skill: "AWS", jdRequirement: "Cloud platform experience", resumeEvidence: "AWS Solutions Architect certified", strength: "strong" },
        { skill: "Docker", jdRequirement: "Container experience", resumeEvidence: "3 years of Docker usage", strength: "moderate" },
        { skill: "PostgreSQL", jdRequirement: "Database experience", resumeEvidence: "4 years of PostgreSQL", strength: "strong" },
      ],
      missingSkills: [
        { skill: "Kubernetes", jdRequirement: "Container orchestration", importance: "preferred", suggestion: "Docker experience is transferable" },
        { skill: "GraphQL", jdRequirement: "API development", importance: "nice_to_have", suggestion: "REST API experience is strong alternative" },
      ],
      transferableSkills: [
        { candidateSkill: "Docker", targetSkill: "Kubernetes", transferability: 0.7, justification: "Container fundamentals transfer well" },
        { candidateSkill: "REST APIs", targetSkill: "GraphQL", transferability: 0.6, justification: "API design principles apply" },
      ],
      totalRequired: 8,
      totalMatched: 6,
      matchPercentage: 75,
    },
    experienceMatch: {
      yearsRequired: 5,
      yearsCandidate: 5,
      matchStatus: "meets",
      relevantExperiences: [
        { experienceId: "exp-1", company: "Tech Corp Inc", title: "Senior Software Engineer", relevanceScore: 0.9, matchingResponsibilities: ["Backend development", "Team leadership"] },
        { experienceId: "exp-2", company: "StartupXYZ", title: "Software Engineer", relevanceScore: 0.75, matchingResponsibilities: ["Full-stack development", "CI/CD"] },
      ],
    },
    educationMatch: {
      required: "Bachelor's in Computer Science",
      candidate: "BS in Computer Science from UC Berkeley",
      matchStatus: "meets",
      notes: "Degree from top-tier university with honors",
    },
    roleAlignment: {
      titleMatch: {
        jdTitle: "Senior Software Engineer",
        resumeTitle: "Senior Software Engineer",
        alignmentScore: 0.95,
        isLateralMove: true,
        isPromotion: false,
        isCareerChange: false,
      },
      seniorityMatch: {
        jdLevel: "senior",
        candidateLevel: "senior",
        matchStatus: "qualified",
      },
    },
  };
}

function getMockAtsScore(prompt: string): object {
  const isConservative = prompt.toLowerCase().includes("conservative");

  return {
    score: isConservative ? 72 : 85,
    model: isConservative ? "conservative" : "aggressive",
    breakdown: {
      keywordMatch: isConservative ? 70 : 82,
      formatCompliance: isConservative ? 85 : 90,
      sectionCompleteness: isConservative ? 80 : 85,
      experienceRelevance: isConservative ? 65 : 80,
      educationMatch: isConservative ? 90 : 92,
    },
    passesThreshold: true,
    threshold: isConservative ? 75 : 60,
    recommendations: [
      "Add more keywords from the job description",
      "Quantify achievements where possible",
      "Ensure consistent date formatting",
    ],
    keywordsFound: ["React", "TypeScript", "Node.js", "AWS", "Docker", "PostgreSQL", "CI/CD"],
    keywordsMissing: ["Kubernetes", "GraphQL", "Terraform"],
  };
}

function getMockGeneratedResume(): object {
  return {
    id: `resume-${Date.now()}`,
    version: 1,
    format: "chronological",
    content: {
      contact: {
        name: "John Doe",
        email: "john.doe@email.com",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
        linkedin: "linkedin.com/in/johndoe",
        github: "github.com/johndoe",
      },
      summary: "Results-driven Senior Software Engineer with 5+ years of experience building scalable web applications using React, TypeScript, and Node.js. Proven track record of leading technical initiatives, optimizing system performance, and mentoring engineering teams. AWS certified with expertise in cloud architecture and microservices design.",
      experience: [
        {
          company: "Tech Corp Inc",
          title: "Senior Software Engineer",
          location: "San Francisco, CA",
          dates: "March 2021 - Present",
          bullets: [
            "Architected and led development of microservices platform serving 1M+ daily active users, improving system reliability by 40%",
            "Optimized API response times by 40% through strategic caching implementation and database query optimization",
            "Mentored team of 5 junior developers, conducting code reviews and establishing best practices that reduced bug rate by 25%",
            "Spearheaded migration to TypeScript, improving code quality and reducing runtime errors by 30%",
          ],
        },
        {
          company: "StartupXYZ",
          title: "Software Engineer",
          location: "Remote",
          dates: "January 2019 - February 2021",
          bullets: [
            "Developed React-based analytics dashboard adopted by 500+ enterprise customers, driving $2M in ARR",
            "Implemented CI/CD pipelines using Jenkins and AWS, reducing deployment time by 60% and enabling daily releases",
            "Built RESTful APIs using Node.js and Express, handling 100K+ requests per day with 99.9% uptime",
          ],
        },
      ],
      education: [
        {
          institution: "University of California, Berkeley",
          degree: "Bachelor of Science in Computer Science",
          dates: "2015 - 2019",
          details: "GPA: 3.7/4.0 | Magna Cum Laude | Dean's List",
        },
      ],
      skills: {
        languages: ["TypeScript", "JavaScript", "Python", "Go"],
        frameworks: ["React", "Node.js", "Next.js", "Express"],
        databases: ["PostgreSQL", "MongoDB", "Redis"],
        cloud: ["AWS", "Docker", "CI/CD", "Kubernetes"],
      },
      certifications: ["AWS Solutions Architect Associate (2023)"],
    },
    changes: [
      { section: "summary", type: "reword", original: "Experienced software engineer", modified: "Results-driven Senior Software Engineer", reason: "Stronger opening with quantified impact" },
      { section: "experience[0].bullets[0]", type: "add_keyword", original: "Led development", modified: "Architected and led development", reason: "Added 'Architected' to match JD emphasis on architecture" },
      { section: "skills", type: "reorder", original: "Random order", modified: "Grouped by relevance", reason: "Prioritized skills mentioned in JD" },
    ],
    complianceNotes: [
      "All information sourced directly from original resume",
      "No fabricated experiences or skills",
      "Metrics preserved from original or safely quantified",
    ],
    atsOptimizations: [
      "Added keywords: 'microservices', 'architecture', 'scalable'",
      "Standardized date format to 'Month YYYY'",
      "Ensured all section headers are ATS-parseable",
    ],
  };
}

function getMockCoverLetter(): object {
  return {
    id: `cover-letter-${Date.now()}`,
    version: 1,
    content: `Dear Hiring Manager,

I am excited to apply for the Senior Software Engineer position at TechCo Inc. Your commitment to building innovative, scalable solutions aligns perfectly with my passion for engineering excellence and my track record of delivering impactful products.

In my current role at Tech Corp Inc, I have led the development of microservices architecture serving over 1 million daily users, demonstrating my ability to build systems at scale. I reduced API response times by 40% through strategic optimization, and I take pride in mentoring junior developers to grow their technical skills. These experiences have prepared me to contribute meaningfully to your team's ambitious goals.

What particularly draws me to TechCo is your focus on hybrid work flexibility and investment in engineering growth. The opportunity to work with cutting-edge technologies while collaborating with talented engineers across locations is exactly the environment where I thrive.

I would welcome the opportunity to discuss how my experience with React, TypeScript, Node.js, and AWS can help drive TechCo's continued success. Thank you for considering my application.

Best regards,
John Doe`,
    paragraphs: [
      { type: "opening", content: "I am excited to apply...", purpose: "Hook with company-specific interest and value proposition" },
      { type: "body", content: "In my current role...", purpose: "Demonstrate relevant experience with quantified achievements" },
      { type: "body", content: "What particularly draws me...", purpose: "Show genuine interest in company culture and role" },
      { type: "closing", content: "I would welcome...", purpose: "Call to action and professional sign-off" },
    ],
    companyPersonalization: [
      "Referenced TechCo's innovative solutions focus",
      "Mentioned hybrid work flexibility from JD",
      "Aligned with engineering growth investment",
    ],
    roleAlignment: [
      "Highlighted microservices experience matching JD requirements",
      "Emphasized mentoring experience for leadership aspect",
      "Connected technical skills directly to role needs",
    ],
    wordCount: 247,
  };
}

function getMockValidation(): object {
  return {
    isValid: true,
    hallucinationCheck: {
      passed: true,
      issues: [],
    },
    factualityCheck: {
      passed: true,
      fabricatedItems: [],
    },
    complianceCheck: {
      passed: true,
      violations: [],
    },
    recommendation: "pass",
  };
}
