"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import {
  ArrowLeft,
  Download,
  Eye,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Mail,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysisStore } from "@/stores/analysisStore";
import { useDocumentStore } from "@/stores/documentStore";
import { useVersionStore } from "@/stores/versionStore";
import { cn } from "@/lib/utils";
import type { ChangeType } from "@/types/resume";

type TabType = "resume" | "coverLetter";
type ViewMode = "diff" | "preview";

interface Change {
  id: string;
  section: string;
  type: ChangeType;
  original: string;
  modified: string;
  reason: string;
  accepted: boolean;
}

export default function EditorPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("resume");
  const [viewMode, setViewMode] = useState<ViewMode>("diff");
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const versionCreated = useRef(false);

  // Connect to stores
  const { generatedResume, generatedCoverLetter, parsedResume } = useAnalysisStore();
  const { userOptions } = useDocumentStore();
  const { addVersion, versions } = useVersionStore();

  // Create initial version on mount
  useEffect(() => {
    if (generatedResume && !versionCreated.current && versions.length === 0) {
      versionCreated.current = true;
      addVersion(generatedResume, generatedCoverLetter ?? null, "Original");
    }
  }, [generatedResume, generatedCoverLetter, addVersion, versions.length]);

  // Populate changes from generated resume
  const [changes, setChanges] = useState<Change[]>([]);

  useEffect(() => {
    if (generatedResume?.changes) {
      setChanges(
        generatedResume.changes.map((c, i) => ({
          id: String(i),
          section: c.section,
          type: c.type,
          original: c.original,
          modified: c.modified,
          reason: c.reason,
          accepted: true,
        }))
      );
    }
  }, [generatedResume]);

  // Redirect if no data
  if (!generatedResume) {
    router.push("/upload");
    return null;
  }

  const resumeContent = generatedResume.content;
  const originalResume = parsedResume;

  const toggleChange = (id: string) => {
    setChanges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, accepted: !c.accepted } : c))
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedChanges((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const acceptedCount = changes.filter((c) => c.accepted).length;

  const handleExport = async (type: "resume" | "coverLetter") => {
    setIsExporting(true);
    try {
      const content = type === "resume" ? generatedResume : generatedCoverLetter;
      if (!content) {
        console.error("No content to export for type:", type);
        return;
      }
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, region: userOptions.region }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBoth = async () => {
    await handleExport("resume");
    if (generatedCoverLetter) {
      await handleExport("coverLetter");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleExport("resume")}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mx-auto max-w-6xl">
          {/* Back link */}
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to analysis
          </Link>

          <div className="space-y-6">
            {/* Title and Tabs */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Review & Edit</h1>
                <p className="text-muted-foreground mt-1">
                  Review changes, accept or reject modifications, and export your optimized documents
                </p>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-4 border-b">
              <button
                onClick={() => setActiveTab("resume")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === "resume"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-4 w-4" />
                Resume
              </button>
              <button
                onClick={() => setActiveTab("coverLetter")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === "coverLetter"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Mail className="h-4 w-4" />
                Cover Letter
              </button>
              <div className="ml-auto flex items-center gap-2 pb-2">
                <Button
                  variant={viewMode === "diff" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("diff")}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Diff View
                </Button>
                <Button
                  variant={viewMode === "preview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("preview")}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </div>
            </div>

            {/* Resume Tab */}
            {activeTab === "resume" && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Changes List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Changes Made</CardTitle>
                    <CardDescription>
                      {changes.length > 0
                        ? `${acceptedCount} of ${changes.length} changes accepted`
                        : "No changes recorded"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {changes.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        The generated resume did not include a detailed change log.
                      </p>
                    )}
                    {changes.map((change) => (
                      <ChangeItem
                        key={change.id}
                        change={change}
                        expanded={expandedChanges.has(change.id)}
                        onToggle={() => toggleChange(change.id)}
                        onExpand={() => toggleExpand(change.id)}
                      />
                    ))}
                  </CardContent>
                </Card>

                {/* Preview/Diff */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {viewMode === "diff" ? "Side-by-Side Comparison" : "Final Preview"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {viewMode === "diff" ? (
                      <DiffView original={originalResume} modified={resumeContent} />
                    ) : (
                      <ResumePreview content={resumeContent} />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Cover Letter Tab */}
            {activeTab === "coverLetter" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Generated Cover Letter</CardTitle>
                    <CardDescription>
                      Personalized for the target company and role
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generatedCoverLetter ? (
                      <>
                        <div className="prose prose-sm max-w-none bg-muted/30 p-6 rounded-lg">
                          {generatedCoverLetter.paragraphs.length > 0 ? (
                            generatedCoverLetter.paragraphs.map((p, i) => (
                              <p key={i} className={i > 0 ? "mt-4" : ""}>
                                {p.content}
                              </p>
                            ))
                          ) : (
                            // Fallback to raw content split by paragraphs
                            generatedCoverLetter.content
                              .split(/\n\n+/)
                              .filter((p) => p.trim())
                              .map((p, i) => (
                                <p key={i} className={i > 0 ? "mt-4" : ""}>
                                  {p.trim()}
                                </p>
                              ))
                          )}
                        </div>

                        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Word count: {generatedCoverLetter.wordCount}</span>
                          <span>|</span>
                          <span className="text-green-600">
                            Company-specific elements: {generatedCoverLetter.companyPersonalization.length}
                          </span>
                          <span>|</span>
                          <span className="text-blue-600">
                            Role alignments: {generatedCoverLetter.roleAlignment.length}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No cover letter was generated. Go back to the analysis to generate one.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Export Actions */}
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <h4 className="font-medium">Ready to export?</h4>
                  <p className="text-sm text-muted-foreground">
                    Your documents will be exported as ATS-compliant PDFs
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExport("resume")}
                    disabled={isExporting}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Resume
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport("coverLetter")}
                    disabled={isExporting || !generatedCoverLetter}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Cover Letter
                  </Button>
                  <Button
                    onClick={handleExportBoth}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Export Both
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Resume preview rendering real data from GeneratedResume.content (ParsedResume)
 */
function ResumePreview({ content }: { content: import("@/types/resume").ParsedResume }) {
  return (
    <div className="prose prose-sm max-w-none">
      <h2 className="text-xl font-bold">{content.contact.name}</h2>
      <p className="text-muted-foreground">
        {[content.contact.email, content.contact.phone, content.contact.location]
          .filter(Boolean)
          .join(" | ")}
      </p>

      {content.summary && (
        <>
          <h3 className="text-lg font-semibold mt-4">Summary</h3>
          <p>{content.summary}</p>
        </>
      )}

      {content.experience.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-4">Experience</h3>
          {content.experience.map((exp) => (
            <div key={exp.id} className="mt-2">
              <p className="font-medium">
                {exp.title} - {exp.company}
              </p>
              <p className="text-sm text-muted-foreground">
                {exp.startDate || ""} - {exp.current ? "Present" : exp.endDate || ""}
                {exp.location ? ` | ${exp.location}` : ""}
              </p>
              <ul className="list-disc list-inside mt-1">
                {exp.bullets.map((bullet) => (
                  <li key={bullet.id}>{bullet.original}</li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}

      {content.education.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-4">Education</h3>
          {content.education.map((edu) => (
            <div key={edu.id} className="mt-1">
              <p className="font-medium">
                {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {edu.institution}
                {edu.endDate ? ` | ${edu.endDate}` : ""}
              </p>
            </div>
          ))}
        </>
      )}

      {content.skills.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-4">Skills</h3>
          {content.skills.map((cat, i) => (
            <p key={i}>
              <span className="font-medium">{cat.category}:</span>{" "}
              {cat.skills.map((s) => s.name).join(", ")}
            </p>
          ))}
        </>
      )}

      {content.certifications.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-4">Certifications</h3>
          {content.certifications.map((cert, i) => (
            <p key={i}>
              {cert.name} - {cert.issuer}
              {cert.date ? ` (${cert.date})` : ""}
            </p>
          ))}
        </>
      )}
    </div>
  );
}

/**
 * Diff view comparing original (parsedResume) vs modified (generatedResume.content)
 */
function DiffView({
  original,
  modified,
}: {
  original: import("@/types/resume").ParsedResume | null;
  modified: import("@/types/resume").ParsedResume;
}) {
  if (!original) {
    return (
      <div className="text-sm text-muted-foreground">
        Original resume data not available for comparison. Switch to Preview mode.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary diff */}
      {(original.summary || modified.summary) && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="text-red-600 font-medium text-xs mb-1">Original</div>
              <p className="text-muted-foreground">{original.summary || "(none)"}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-green-600 font-medium text-xs mb-1">Modified</div>
              <p>{modified.summary || "(none)"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Experience diff */}
      {modified.experience.map((modExp, i) => {
        const origExp = original.experience[i];
        return (
          <div key={modExp.id}>
            <h4 className="text-sm font-semibold mb-2">
              {modExp.title} - {modExp.company}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="text-red-600 font-medium text-xs mb-1">Original</div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {origExp ? (
                    origExp.bullets.map((b) => (
                      <li key={b.id}>{b.original}</li>
                    ))
                  ) : (
                    <li>(new section)</li>
                  )}
                </ul>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-green-600 font-medium text-xs mb-1">Modified</div>
                <ul className="list-disc list-inside space-y-1">
                  {modExp.bullets.map((b) => (
                    <li key={b.id} className="text-green-800">{b.original}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}

      {/* Skills diff */}
      {modified.skills.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Skills</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="text-red-600 font-medium text-xs mb-1">Original</div>
              {original.skills.map((cat, i) => (
                <p key={i} className="text-muted-foreground">
                  <span className="font-medium">{cat.category}:</span>{" "}
                  {cat.skills.map((s) => s.name).join(", ")}
                </p>
              ))}
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-green-600 font-medium text-xs mb-1">Modified</div>
              {modified.skills.map((cat, i) => (
                <p key={i}>
                  <span className="font-medium">{cat.category}:</span>{" "}
                  {cat.skills.map((s) => s.name).join(", ")}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual change item with accept/reject toggle
 */
function ChangeItem({
  change,
  expanded,
  onToggle,
  onExpand,
}: {
  change: Change;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}) {
  const typeLabels: Record<ChangeType, string> = {
    reorder: "Reorder",
    reword: "Reword",
    add_keyword: "Keyword",
    format: "Format",
  };

  const typeColors: Record<ChangeType, string> = {
    reorder: "bg-purple-100 text-purple-800",
    reword: "bg-blue-100 text-blue-800",
    add_keyword: "bg-green-100 text-green-800",
    format: "bg-gray-100 text-gray-800",
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-3 transition-colors",
        change.accepted ? "bg-green-50 border-green-200" : "bg-muted/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                typeColors[change.type]
              )}
            >
              {typeLabels[change.type]}
            </span>
            <span className="text-sm font-medium truncate">{change.section}</span>
          </div>
          <p className="text-xs text-muted-foreground">{change.reason}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExpand}
            className="h-8 w-8 p-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant={change.accepted ? "default" : "outline"}
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {change.accepted ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-red-50 p-2 rounded">
            <div className="text-red-600 font-medium mb-1">Original</div>
            <div className="line-through text-muted-foreground">
              {change.original}
            </div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-green-600 font-medium mb-1">Modified</div>
            <div>{change.modified}</div>
          </div>
        </div>
      )}
    </div>
  );
}
