/**
 * PDF Parser
 * Extracts text content from PDF files using pdf-parse (Node.js compatible)
 */

// Import the actual parser module directly to avoid pdf-parse's debug mode
// which tries to load a test PDF file
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export interface PdfMetadata {
  title: string | null;
  author: string | null;
  subject: string | null;
  keywords: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: Date | null;
  modDate: Date | null;
}

export interface PdfParseResult {
  text: string;
  pageCount: number;
  metadata: PdfMetadata;
  pages: string[];
}

/**
 * Convert File to ArrayBuffer
 */
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as ArrayBuffer"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Check if data is a valid PDF
 */
export function isValidPdf(data: ArrayBuffer): boolean {
  const arr = new Uint8Array(data.slice(0, 5));
  const header = String.fromCharCode(...arr);
  return header === "%PDF-";
}

/**
 * Get PDF page count without full extraction
 */
export async function getPdfPageCount(data: ArrayBuffer): Promise<number> {
  const buffer = Buffer.from(data);
  const result = await pdfParse(buffer);
  return result.numpages;
}

/**
 * Extract all text from a PDF
 */
export async function extractTextFromPdf(
  data: ArrayBuffer
): Promise<PdfParseResult> {
  console.log("[extractTextFromPdf] Starting extraction, data size:", data.byteLength);

  if (!isValidPdf(data)) {
    console.error("[extractTextFromPdf] Invalid PDF file");
    throw new Error("Invalid PDF file");
  }

  console.log("[extractTextFromPdf] PDF header valid, parsing document...");

  const buffer = Buffer.from(data);
  const result = await pdfParse(buffer);

  console.log("[extractTextFromPdf] Document parsed, pages:", result.numpages);

  const metadata: PdfMetadata = {
    title: result.info?.Title || null,
    author: result.info?.Author || null,
    subject: result.info?.Subject || null,
    keywords: result.info?.Keywords || null,
    creator: result.info?.Creator || null,
    producer: result.info?.Producer || null,
    creationDate: result.info?.CreationDate ? new Date(result.info.CreationDate) : null,
    modDate: result.info?.ModDate ? new Date(result.info.ModDate) : null,
  };

  // pdf-parse returns text as a single string, split by double newlines for approximate pages
  const text = result.text;
  const pages = text.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);

  console.log("[extractTextFromPdf] Total text length:", text.length);

  return {
    text,
    pageCount: result.numpages,
    metadata,
    pages,
  };
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPdfFile(file: File): Promise<PdfParseResult> {
  const arrayBuffer = await fileToArrayBuffer(file);
  return extractTextFromPdf(arrayBuffer);
}

/**
 * Clean extracted text (remove extra whitespace, normalize)
 */
export function cleanExtractedText(text: string): string {
  return text
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove excessive blank lines
    .replace(/\n{3,}/g, "\n\n")
    // Trim lines
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    // Remove page break markers for final text
    .replace(/\n*--- Page Break ---\n*/g, "\n\n")
    .trim();
}

/**
 * Extract sections from resume text using common headers
 */
export function extractResumeSections(text: string): Record<string, string> {
  const sectionHeaders = [
    "summary",
    "objective",
    "experience",
    "work experience",
    "professional experience",
    "employment",
    "education",
    "skills",
    "technical skills",
    "certifications",
    "certificates",
    "projects",
    "awards",
    "publications",
    "languages",
    "interests",
    "references",
  ];

  const sections: Record<string, string> = {};
  const lines = text.split("\n");
  let currentSection = "header";
  let currentContent: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();

    // Check if this line is a section header
    const matchedHeader = sectionHeaders.find(
      (header) =>
        lowerLine === header ||
        lowerLine === header + ":" ||
        lowerLine.startsWith(header + " ")
    );

    if (matchedHeader) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join("\n").trim();
      }
      currentSection = matchedHeader;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join("\n").trim();
  }

  return sections;
}
