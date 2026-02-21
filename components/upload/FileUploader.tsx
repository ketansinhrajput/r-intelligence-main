"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  type: "resume" | "coverLetter" | "jd";
  file: File | null;
  onFileSelect: (file: File | null) => void;
  required?: boolean;
  className?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUploader({
  type,
  file,
  onFileSelect,
  required = false,
  className,
}: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const labels = {
    resume: {
      title: "Resume",
      description: "Upload your resume (PDF, 2 pages preferred)",
    },
    coverLetter: {
      title: "Cover Letter",
      description: "Upload your existing cover letter (optional)",
    },
    jd: {
      title: "Job Description",
      description: "Upload job description PDF",
    },
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: Array<{ file: File; errors: readonly { message: string; code: string }[] }>) => {
      setError(null);

      if (fileRejections.length > 0) {
        const firstError = fileRejections[0]?.errors[0]?.message;
        setError(firstError ?? "Invalid file");
        return;
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
          if (selectedFile.size > MAX_FILE_SIZE) {
            setError("File size must be less than 10MB");
            return;
          }
          onFileSelect(selectedFile);
        }
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setError(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {labels[type].title}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-auto p-1 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
          isDragActive
            ? "border-primary bg-primary/5"
            : file
            ? "border-success bg-success/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          error && "border-destructive bg-destructive/5"
        )}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <File className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium truncate max-w-[200px]">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground text-center">
              {isDragActive ? (
                "Drop your file here"
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {labels[type].description}
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
