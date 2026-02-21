"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, Link as LinkIcon, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/upload/FileUploader";
import { UrlInput } from "@/components/upload/UrlInput";
import { OptionsSelector } from "@/components/upload/OptionsSelector";
import { LLMConfigPanel } from "@/components/upload/LLMConfigPanel";
import { useDocumentStore } from "@/stores/documentStore";
import { useAnalysisStore } from "@/stores/analysisStore";
import { useLLMConfigStore } from "@/stores/llmConfigStore";
import { cn } from "@/lib/utils";

type JdInputMethod = "url" | "pdf";

export default function UploadPage() {
  const router = useRouter();
  const [jdInputMethod, setJdInputMethod] = useState<JdInputMethod>("url");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    resumeFile,
    coverLetterFile,
    jdSource,
    userOptions,
    validationErrors,
    setResumeFile,
    setCoverLetterFile,
    setJdSource,
    setUserOptions,
    validateInputs,
  } = useDocumentStore();

  const { startAnalysis } = useAnalysisStore();
  const { isConfigured: isLLMConfigured } = useLLMConfigStore();

  const handleJdMethodChange = (method: JdInputMethod) => {
    setJdInputMethod(method);
    setJdSource({
      type: method,
      value: null,
    });
  };

  const handleJdUrlChange = (url: string) => {
    setJdSource({
      type: "url",
      value: url,
    });
  };

  const handleJdFileChange = (file: File | null) => {
    setJdSource({
      type: "pdf",
      value: file,
    });
  };

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsSubmitting(true);
    startAnalysis();

    // Navigate to analysis page
    router.push("/analyze");
  };

  const isValid =
    resumeFile &&
    isLLMConfigured &&
    (jdInputMethod === "url"
      ? typeof jdSource.value === "string" && jdSource.value.length > 0
      : jdSource.value instanceof File);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>

      <main className="container py-8">
        <div className="mx-auto max-w-3xl">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="space-y-8">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold">Upload Documents</h1>
              <p className="text-muted-foreground mt-2">
                Upload your resume and job description to get started with the analysis.
              </p>
            </div>

            {/* Resume Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Your Resume</CardTitle>
                <CardDescription>
                  Upload your current resume in PDF format (2 pages preferred)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader
                  type="resume"
                  file={resumeFile}
                  onFileSelect={setResumeFile}
                  required
                />
              </CardContent>
            </Card>

            {/* Cover Letter Upload (Optional) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Cover Letter (Optional)</CardTitle>
                <CardDescription>
                  Upload your existing cover letter for reference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader
                  type="coverLetter"
                  file={coverLetterFile}
                  onFileSelect={setCoverLetterFile}
                />
              </CardContent>
            </Card>

            {/* Job Description Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Job Description</CardTitle>
                <CardDescription>
                  Provide the job description via URL or PDF upload
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Method Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={jdInputMethod === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleJdMethodChange("url")}
                    className="flex items-center gap-2"
                  >
                    <LinkIcon className="h-4 w-4" />
                    URL
                  </Button>
                  <Button
                    variant={jdInputMethod === "pdf" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleJdMethodChange("pdf")}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    PDF Upload
                  </Button>
                </div>

                {/* Input based on method */}
                {jdInputMethod === "url" ? (
                  <UrlInput
                    value={typeof jdSource.value === "string" ? jdSource.value : ""}
                    onChange={handleJdUrlChange}
                  />
                ) : (
                  <FileUploader
                    type="jd"
                    file={jdSource.value instanceof File ? jdSource.value : null}
                    onFileSelect={handleJdFileChange}
                    required
                  />
                )}
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Options</CardTitle>
                <CardDescription>
                  Configure your preferences for the generated output
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OptionsSelector
                  options={userOptions}
                  onChange={setUserOptions}
                />
              </CardContent>
            </Card>

            {/* LLM Provider Config */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">LLM Provider</CardTitle>
                <CardDescription>
                  Configure the AI provider endpoint, API key, and model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LLMConfigPanel />
              </CardContent>
            </Card>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                <h4 className="font-medium text-destructive mb-2">
                  Please fix the following errors:
                </h4>
                <ul className="list-disc list-inside text-sm text-destructive">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    Start Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
