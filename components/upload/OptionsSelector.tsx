"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { UserOptions, AtsSystem, Region, CoverLetterLength } from "@/types/analysis";
import type { ResumeFormat } from "@/types/resume";

interface OptionsSelectorProps {
  options: UserOptions;
  onChange: (options: Partial<UserOptions>) => void;
  className?: string;
}

const RESUME_FORMATS: { value: ResumeFormat; label: string; description: string }[] = [
  {
    value: "chronological",
    label: "Chronological",
    description: "Most recent experience first",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    description: "Skills + experience combined",
  },
  {
    value: "functional",
    label: "Functional",
    description: "Skills-focused format",
  },
];

const ATS_SYSTEMS: { value: AtsSystem; label: string }[] = [
  { value: "generic", label: "Generic ATS" },
  { value: "workday", label: "Workday" },
  { value: "greenhouse", label: "Greenhouse" },
  { value: "lever", label: "Lever" },
];

const REGIONS: { value: Region; label: string }[] = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "eu", label: "European Union" },
  { value: "germany", label: "Germany" },
  { value: "india", label: "India" },
  { value: "uae", label: "UAE" },
];

const COVER_LETTER_LENGTHS: { value: CoverLetterLength; label: string; words: string }[] = [
  { value: "short", label: "Short", words: "150-200 words" },
  { value: "medium", label: "Medium", words: "250-300 words" },
  { value: "long", label: "Long", words: "350-400 words" },
];

export function OptionsSelector({
  options,
  onChange,
  className,
}: OptionsSelectorProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <h3 className="text-lg font-semibold">Configuration Options</h3>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Resume Format */}
        <div className="space-y-2">
          <Label htmlFor="resume-format">Resume Format</Label>
          <Select
            value={options.resumeFormat}
            onValueChange={(value: ResumeFormat) =>
              onChange({ resumeFormat: value })
            }
          >
            <SelectTrigger id="resume-format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {RESUME_FORMATS.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  <div className="flex flex-col">
                    <span>{format.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {format.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Target ATS */}
        <div className="space-y-2">
          <Label htmlFor="target-ats">Target ATS System</Label>
          <Select
            value={options.targetAts}
            onValueChange={(value: AtsSystem) => onChange({ targetAts: value })}
          >
            <SelectTrigger id="target-ats">
              <SelectValue placeholder="Select ATS" />
            </SelectTrigger>
            <SelectContent>
              {ATS_SYSTEMS.map((ats) => (
                <SelectItem key={ats.value} value={ats.value}>
                  {ats.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Optimizes formatting for the selected ATS
          </p>
        </div>

        {/* Region */}
        <div className="space-y-2">
          <Label htmlFor="region">Region Compliance</Label>
          <Select
            value={options.region}
            onValueChange={(value: Region) => onChange({ region: value })}
          >
            <SelectTrigger id="region">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Applies region-specific formatting rules
          </p>
        </div>

        {/* Cover Letter Length */}
        <div className="space-y-2">
          <Label htmlFor="cl-length">Cover Letter Length</Label>
          <Select
            value={options.coverLetterLength}
            onValueChange={(value: CoverLetterLength) =>
              onChange({ coverLetterLength: value })
            }
          >
            <SelectTrigger id="cl-length">
              <SelectValue placeholder="Select length" />
            </SelectTrigger>
            <SelectContent>
              {COVER_LETTER_LENGTHS.map((length) => (
                <SelectItem key={length.value} value={length.value}>
                  <div className="flex items-center gap-2">
                    <span>{length.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ({length.words})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
