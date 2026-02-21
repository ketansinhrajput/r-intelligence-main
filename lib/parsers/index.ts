/**
 * Parser Module Exports
 */

export {
  extractTextFromPdf,
  extractTextFromPdfFile,
  isValidPdf,
  getPdfPageCount,
  fileToArrayBuffer,
  cleanExtractedText,
  extractResumeSections,
  type PdfParseResult,
  type PdfMetadata,
} from "./pdfParser";

export {
  scrapeJobDescription,
  isJobPostingUrl,
  type ScrapeResult,
} from "./urlScraper";
