/**
 * Job Description URL Scraper
 * Extracts job posting content from various job board URLs
 */

export interface ScrapeResult {
  success: boolean;
  text: string;
  title: string | null;
  company: string | null;
  location: string | null;
  source: string;
  error: string | null;
}

// Known job board patterns
const JOB_BOARD_PATTERNS = {
  linkedin: /linkedin\.com\/jobs/i,
  greenhouse: /greenhouse\.io|boards\.greenhouse\.io/i,
  lever: /lever\.co|jobs\.lever\.co/i,
  workday: /workday\.com|myworkdayjobs\.com/i,
  indeed: /indeed\.com/i,
  glassdoor: /glassdoor\.com/i,
};

/**
 * Check if URL is a job posting URL
 */
export function isJobPostingUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Check known job boards
    for (const pattern of Object.values(JOB_BOARD_PATTERNS)) {
      if (pattern.test(parsed.hostname)) {
        return true;
      }
    }

    // Check for common career page patterns
    const careerPatterns = [
      /careers?\./i,
      /jobs?\./i,
      /\/careers/i,
      /\/jobs/i,
      /\/job\//i,
      /\/position/i,
      /\/opening/i,
      /\/vacancy/i,
    ];

    return careerPatterns.some(
      (pattern) => pattern.test(parsed.hostname) || pattern.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * Detect job board from URL
 */
function detectJobBoard(url: string): string {
  for (const [name, pattern] of Object.entries(JOB_BOARD_PATTERNS)) {
    if (pattern.test(url)) {
      return name;
    }
  }
  return "unknown";
}

/**
 * Scrape job description from URL
 */
export async function scrapeJobDescription(url: string): Promise<ScrapeResult> {
  console.log("[scrapeJobDescription] Starting scrape for:", url);

  try {
    // Validate URL
    const parsed = new URL(url);
    const source = detectJobBoard(url);
    console.log("[scrapeJobDescription] Detected source:", source);

    // Fetch the page content
    console.log("[scrapeJobDescription] Fetching page...");
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    console.log("[scrapeJobDescription] Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log("[scrapeJobDescription] HTML length:", html.length);

    // Extract content based on job board
    let result: ScrapeResult;

    switch (source) {
      case "linkedin":
        result = extractLinkedInJob(html, url);
        break;
      case "greenhouse":
        result = extractGreenhouseJob(html, url);
        break;
      case "lever":
        result = extractLeverJob(html, url);
        break;
      default:
        result = extractGenericJob(html, url);
    }

    result.source = source;
    console.log("[scrapeJobDescription] Extraction result - success:", result.success, "text length:", result.text.length);
    return result;
  } catch (error) {
    console.error("[scrapeJobDescription] Error:", error);
    return {
      success: false,
      text: "",
      title: null,
      company: null,
      location: null,
      source: "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract LinkedIn job posting
 */
function extractLinkedInJob(html: string, url: string): ScrapeResult {
  // LinkedIn uses specific class names and data attributes
  const titleMatch = html.match(
    /<h1[^>]*class="[^"]*job-title[^"]*"[^>]*>([^<]+)<\/h1>/i
  );
  const companyMatch = html.match(
    /<a[^>]*class="[^"]*company-name[^"]*"[^>]*>([^<]+)<\/a>/i
  );
  const locationMatch = html.match(
    /<span[^>]*class="[^"]*job-location[^"]*"[^>]*>([^<]+)<\/span>/i
  );

  // Extract job description content
  const descMatch = html.match(
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );

  const text = cleanHtml(descMatch?.[1] || extractMainContent(html));

  return {
    success: text.length > 100,
    text,
    title: titleMatch?.[1]?.trim() || null,
    company: companyMatch?.[1]?.trim() || null,
    location: locationMatch?.[1]?.trim() || null,
    source: "linkedin",
    error: text.length < 100 ? "Could not extract job description" : null,
  };
}

/**
 * Extract Greenhouse job posting
 */
function extractGreenhouseJob(html: string, url: string): ScrapeResult {
  // Greenhouse uses specific IDs and classes
  const titleMatch = html.match(/<h1[^>]*class="app-title"[^>]*>([^<]+)<\/h1>/i);
  const companyMatch = html.match(
    /<span[^>]*class="company-name"[^>]*>([^<]+)<\/span>/i
  );
  const locationMatch = html.match(
    /<div[^>]*class="location"[^>]*>([^<]+)<\/div>/i
  );

  // Job content is usually in #content or .content
  const contentMatch = html.match(
    /<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>/i
  );

  const text = cleanHtml(contentMatch?.[1] || extractMainContent(html));

  return {
    success: text.length > 100,
    text,
    title: titleMatch?.[1]?.trim() || null,
    company: companyMatch?.[1]?.trim() || null,
    location: locationMatch?.[1]?.trim() || null,
    source: "greenhouse",
    error: text.length < 100 ? "Could not extract job description" : null,
  };
}

/**
 * Extract Lever job posting
 */
function extractLeverJob(html: string, url: string): ScrapeResult {
  // Lever uses specific class names
  const titleMatch = html.match(
    /<h2[^>]*class="posting-headline"[^>]*>([^<]+)<\/h2>/i
  );
  const companyMatch = html.match(
    /<div[^>]*class="company-name"[^>]*>([^<]+)<\/div>/i
  );
  const locationMatch = html.match(
    /<div[^>]*class="posting-categories"[^>]*>[\s\S]*?<span[^>]*class="location"[^>]*>([^<]+)<\/span>/i
  );

  // Job content sections
  const sectionsMatch = html.match(
    /<div[^>]*class="section[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
  );

  const text = cleanHtml(
    sectionsMatch?.join("\n\n") || extractMainContent(html)
  );

  return {
    success: text.length > 100,
    text,
    title: titleMatch?.[1]?.trim() || null,
    company: companyMatch?.[1]?.trim() || null,
    location: locationMatch?.[1]?.trim() || null,
    source: "lever",
    error: text.length < 100 ? "Could not extract job description" : null,
  };
}

/**
 * Generic job extraction for unknown sites
 */
function extractGenericJob(html: string, url: string): ScrapeResult {
  // Try to find title from various common patterns
  const titlePatterns = [
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /<title>([^<|]+)/i,
    /class="[^"]*job-title[^"]*"[^>]*>([^<]+)/i,
    /class="[^"]*title[^"]*"[^>]*>([^<]+)/i,
  ];

  let title: string | null = null;
  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      title = match[1].trim();
      break;
    }
  }

  // Try to find company name
  const companyPatterns = [
    /class="[^"]*company[^"]*"[^>]*>([^<]+)/i,
    /class="[^"]*employer[^"]*"[^>]*>([^<]+)/i,
    /<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/i,
  ];

  let company: string | null = null;
  for (const pattern of companyPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      company = match[1].trim();
      break;
    }
  }

  const text = extractMainContent(html);

  return {
    success: text.length > 100,
    text,
    title,
    company,
    location: null,
    source: "generic",
    error: text.length < 100 ? "Could not extract job description" : null,
  };
}

/**
 * Extract main content from HTML
 */
function extractMainContent(html: string): string {
  // Remove script and style tags
  let content = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Try to find main content area
  const mainPatterns = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="job-description"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of mainPatterns) {
    const match = content.match(pattern);
    if (match?.[1] && match[1].length > 200) {
      content = match[1];
      break;
    }
  }

  return cleanHtml(content);
}

/**
 * Clean HTML and convert to plain text
 */
function cleanHtml(html: string): string {
  return html
    // Remove HTML tags but preserve some structure
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    // Decode HTML entities
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&bull;/gi, "•")
    // Clean up whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
