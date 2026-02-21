/**
 * Export API Route
 * Generates PDF exports of resumes and cover letters
 */

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { GeneratedResume, GeneratedCoverLetter, Region } from "@/types";

export const runtime = "edge";
export const maxDuration = 30;

interface ExportRequest {
  type: "resume" | "coverLetter";
  content: GeneratedResume | GeneratedCoverLetter;
  region: Region;
}

const MARGIN = 50;
const LINE_HEIGHT = 14;
const SECTION_GAP = 20;

/**
 * Sanitize text for WinAnsi encoding (pdf-lib StandardFonts limitation).
 * Replaces Unicode characters that WinAnsi cannot encode with ASCII equivalents.
 */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\r\n]+/g, " ")               // newlines to spaces (pdf-lib can't render them)
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-") // various hyphens/dashes
    .replace(/[\u2018\u2019\u201A]/g, "'")  // smart single quotes
    .replace(/[\u201C\u201D\u201E]/g, '"')  // smart double quotes
    .replace(/\u2026/g, "...")               // ellipsis
    .replace(/\u2022/g, "*")                 // bullet
    .replace(/[\u00A0]/g, " ")              // non-breaking space
    .replace(/[\u2002\u2003\u2009]/g, " ")  // en/em/thin space
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ""); // strip any remaining non-WinAnsi chars
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExportRequest;

    if (!body.content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    let pdfBytes: Uint8Array;

    if (body.type === "resume") {
      pdfBytes = await generateResumePdf(
        body.content as GeneratedResume,
        body.region
      );
    } else {
      pdfBytes = await generateCoverLetterPdf(
        body.content as GeneratedCoverLetter,
        body.region
      );
    }

    // Convert Uint8Array to Response-compatible format
    // Create a new ArrayBuffer and copy the data to ensure compatibility
    const arrayBuffer = new ArrayBuffer(pdfBytes.length);
    new Uint8Array(arrayBuffer).set(pdfBytes);

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${body.type}-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      {
        error: "Export failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function generateResumePdf(
  resume: GeneratedResume,
  region: Region
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([612, 792]); // Letter size
  let yPosition = 792 - MARGIN;

  const content = resume.content;

  // Helper function to add text
  const addText = (
    rawText: string,
    options: {
      size?: number;
      bold?: boolean;
      indent?: number;
      color?: [number, number, number];
    } = {}
  ) => {
    const text = sanitizeForPdf(rawText);
    const { size = 10, bold = false, indent = 0, color = [0, 0, 0] } = options;
    const selectedFont = bold ? boldFont : font;

    // Check if we need a new page
    if (yPosition < MARGIN + LINE_HEIGHT) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = 792 - MARGIN;
    }

    // Handle long lines by wrapping
    const maxWidth = 612 - 2 * MARGIN - indent;
    const words = text.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = selectedFont.widthOfTextAtSize(testLine, size);

      if (width > maxWidth && line) {
        page.drawText(line, {
          x: MARGIN + indent,
          y: yPosition,
          size,
          font: selectedFont,
          color: rgb(...color),
        });
        yPosition -= LINE_HEIGHT;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      page.drawText(line, {
        x: MARGIN + indent,
        y: yPosition,
        size,
        font: selectedFont,
        color: rgb(...color),
      });
      yPosition -= LINE_HEIGHT;
    }
  };

  // Name
  addText(content.contact.name, { size: 18, bold: true });
  yPosition -= 5;

  // Contact info
  const contactParts = [
    content.contact.email,
    content.contact.phone,
    content.contact.location,
  ].filter(Boolean);
  addText(contactParts.join(" | "), { size: 9, color: [0.3, 0.3, 0.3] });

  // Links
  const links = [content.contact.linkedin, content.contact.github].filter(Boolean);
  if (links.length > 0) {
    addText(links.join(" | "), { size: 9, color: [0, 0, 0.6] });
  }

  yPosition -= SECTION_GAP;

  // Summary
  if (content.summary) {
    addText("SUMMARY", { size: 11, bold: true });
    yPosition -= 5;
    addText(content.summary, { size: 10 });
    yPosition -= SECTION_GAP;
  }

  // Experience
  if (content.experience.length > 0) {
    addText("EXPERIENCE", { size: 11, bold: true });
    yPosition -= 5;

    for (const exp of content.experience) {
      addText(exp.title, { size: 10, bold: true });
      addText(`${exp.company}${exp.location ? ` | ${exp.location}` : ""}`, {
        size: 9,
        color: [0.3, 0.3, 0.3],
      });
      addText(
        `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`,
        { size: 9, color: [0.4, 0.4, 0.4] }
      );
      yPosition -= 3;

      for (const bullet of exp.bullets) {
        addText(`• ${bullet.original}`, { size: 9, indent: 10 });
      }
      yPosition -= 10;
    }
  }

  yPosition -= SECTION_GAP / 2;

  // Education
  if (content.education.length > 0) {
    addText("EDUCATION", { size: 11, bold: true });
    yPosition -= 5;

    for (const edu of content.education) {
      addText(`${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`, {
        size: 10,
        bold: true,
      });
      addText(edu.institution, { size: 9 });
      if (edu.endDate) {
        addText(edu.endDate, { size: 9, color: [0.4, 0.4, 0.4] });
      }
      yPosition -= 5;
    }
  }

  yPosition -= SECTION_GAP / 2;

  // Skills
  if (content.skills.length > 0) {
    addText("SKILLS", { size: 11, bold: true });
    yPosition -= 5;

    for (const category of content.skills) {
      const skillNames = category.skills.map((s) => s.name).join(", ");
      addText(`${category.category}: ${skillNames}`, { size: 9 });
    }
  }

  // Certifications
  if (content.certifications.length > 0) {
    yPosition -= SECTION_GAP / 2;
    addText("CERTIFICATIONS", { size: 11, bold: true });
    yPosition -= 5;

    for (const cert of content.certifications) {
      const parts = [cert.name, cert.issuer, cert.date].filter(Boolean);
      addText(parts.join(" | "), { size: 9 });
    }
  }

  return pdfDoc.save();
}

async function generateCoverLetterPdf(
  coverLetter: GeneratedCoverLetter,
  region: Region
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  const page = pdfDoc.addPage([612, 792]);
  let yPosition = 792 - MARGIN;

  // Helper function to add text
  const addText = (rawText: string, size = 11) => {
    const text = sanitizeForPdf(rawText);
    const maxWidth = 612 - 2 * MARGIN;
    const words = text.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, size);

      if (width > maxWidth && line) {
        page.drawText(line, {
          x: MARGIN,
          y: yPosition,
          size,
          font,
        });
        yPosition -= LINE_HEIGHT + 2;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      page.drawText(line, {
        x: MARGIN,
        y: yPosition,
        size,
        font,
      });
      yPosition -= LINE_HEIGHT + 2;
    }
  };

  // Add date
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  addText(date);
  yPosition -= SECTION_GAP;

  // Add body paragraphs
  for (const paragraph of coverLetter.paragraphs) {
    addText(paragraph.content);
    yPosition -= SECTION_GAP / 2;
  }

  return pdfDoc.save();
}
