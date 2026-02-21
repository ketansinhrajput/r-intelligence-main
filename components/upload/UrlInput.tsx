"use client";

import { useState, useEffect } from "react";
import { Link, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

type ValidationState = "idle" | "validating" | "valid" | "invalid";

export function UrlInput({ value, onChange, className }: UrlInputProps) {
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setValidationState("idle");
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      validateUrl(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  const validateUrl = (url: string) => {
    setValidationState("validating");
    setError(null);

    try {
      const parsed = new URL(url);

      // Check for supported job posting sites
      const supportedDomains = [
        "linkedin.com",
        "greenhouse.io",
        "lever.co",
        "jobs.lever.co",
        "boards.greenhouse.io",
        "workday.com",
        "myworkdayjobs.com",
        "indeed.com",
        "glassdoor.com",
      ];

      const isSupported = supportedDomains.some((domain) =>
        parsed.hostname.includes(domain)
      );

      if (!isSupported && !parsed.hostname.includes("careers")) {
        setValidationState("valid");
        setError(
          "URL may not be a job posting. We'll try to extract the job description anyway."
        );
      } else {
        setValidationState("valid");
      }
    } catch {
      setValidationState("invalid");
      setError("Please enter a valid URL");
    }
  };

  const getIcon = () => {
    switch (validationState) {
      case "validating":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "valid":
        return <Check className="h-4 w-4 text-success" />;
      case "invalid":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Link className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">
        Job Description URL
        <span className="text-destructive ml-1">*</span>
      </label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {getIcon()}
        </div>
        <Input
          type="url"
          placeholder="https://linkedin.com/jobs/view/..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "pl-10",
            validationState === "valid" && "border-success",
            validationState === "invalid" && "border-destructive"
          )}
        />
      </div>

      {error && (
        <p
          className={cn(
            "text-xs",
            validationState === "invalid"
              ? "text-destructive"
              : "text-muted-foreground"
          )}
        >
          {error}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Supported: LinkedIn, Greenhouse, Lever, Workday, Indeed, Glassdoor, or any
        company careers page
      </p>
    </div>
  );
}
