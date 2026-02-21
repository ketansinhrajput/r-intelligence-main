declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  }

  interface PdfMetadata {
    _metadata?: Record<string, unknown>;
  }

  interface PdfData {
    numpages: number;
    numrender: number;
    info: PdfInfo | null;
    metadata: PdfMetadata | null;
    text: string;
    version: string;
  }

  interface PdfOptions {
    pagerender?: (pageData: unknown) => Promise<string>;
    max?: number;
    version?: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: PdfOptions): Promise<PdfData>;

  export = pdfParse;
}
