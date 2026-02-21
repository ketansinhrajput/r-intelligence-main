/**
 * Document Store
 * Manages uploaded documents and user options
 */

import { create } from "zustand";
import type { UserOptions, Region, AtsSystem, CoverLetterLength } from "@/types/analysis";
import type { ResumeFormat } from "@/types/resume";
import type { JdSource } from "@/types/jd";

interface JdSourceState {
  type: JdSource;
  value: string | File | null;
}

interface DocumentState {
  // Documents
  resumeFile: File | null;
  coverLetterFile: File | null;
  jdSource: JdSourceState;

  // User options
  userOptions: UserOptions;

  // Validation
  validationErrors: string[];
}

interface DocumentActions {
  // Document setters
  setResumeFile: (file: File | null) => void;
  setCoverLetterFile: (file: File | null) => void;
  setJdSource: (source: JdSourceState) => void;

  // Option setters
  setResumeFormat: (format: ResumeFormat) => void;
  setTargetAts: (ats: AtsSystem) => void;
  setRegion: (region: Region) => void;
  setCoverLetterLength: (length: CoverLetterLength) => void;
  setUserOptions: (options: Partial<UserOptions>) => void;

  // Validation
  validateInputs: () => boolean;
  clearValidationErrors: () => void;

  // Reset
  reset: () => void;
}

type DocumentStore = DocumentState & DocumentActions;

const initialState: DocumentState = {
  resumeFile: null,
  coverLetterFile: null,
  jdSource: {
    type: "url",
    value: null,
  },
  userOptions: {
    resumeFormat: "chronological",
    targetAts: "generic",
    region: "us",
    coverLetterLength: "medium",
  },
  validationErrors: [],
};

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  ...initialState,

  setResumeFile: (file) => {
    set({ resumeFile: file });
    get().clearValidationErrors();
  },

  setCoverLetterFile: (file) => {
    set({ coverLetterFile: file });
  },

  setJdSource: (source) => {
    set({ jdSource: source });
    get().clearValidationErrors();
  },

  setResumeFormat: (format) => {
    set((state) => ({
      userOptions: { ...state.userOptions, resumeFormat: format },
    }));
  },

  setTargetAts: (ats) => {
    set((state) => ({
      userOptions: { ...state.userOptions, targetAts: ats },
    }));
  },

  setRegion: (region) => {
    set((state) => ({
      userOptions: { ...state.userOptions, region },
    }));
  },

  setCoverLetterLength: (length) => {
    set((state) => ({
      userOptions: { ...state.userOptions, coverLetterLength: length },
    }));
  },

  setUserOptions: (options) => {
    set((state) => ({
      userOptions: { ...state.userOptions, ...options },
    }));
  },

  validateInputs: () => {
    const errors: string[] = [];
    const state = get();

    // Check resume
    if (!state.resumeFile) {
      errors.push("Resume file is required");
    } else if (!state.resumeFile.name.toLowerCase().endsWith(".pdf")) {
      errors.push("Resume must be a PDF file");
    }

    // Check JD source
    if (state.jdSource.type === "url") {
      if (!state.jdSource.value || typeof state.jdSource.value !== "string") {
        errors.push("Job description URL is required");
      } else {
        try {
          new URL(state.jdSource.value);
        } catch {
          errors.push("Invalid job description URL");
        }
      }
    } else if (state.jdSource.type === "pdf") {
      if (!state.jdSource.value || !(state.jdSource.value instanceof File)) {
        errors.push("Job description PDF is required");
      }
    }

    set({ validationErrors: errors });
    return errors.length === 0;
  },

  clearValidationErrors: () => {
    set({ validationErrors: [] });
  },

  reset: () => {
    set(initialState);
  },
}));

// Selectors
export const selectResumeFile = (state: DocumentStore) => state.resumeFile;
export const selectCoverLetterFile = (state: DocumentStore) => state.coverLetterFile;
export const selectJdSource = (state: DocumentStore) => state.jdSource;
export const selectUserOptions = (state: DocumentStore) => state.userOptions;
export const selectIsValid = (state: DocumentStore) =>
  state.resumeFile !== null &&
  (state.jdSource.type === "url"
    ? typeof state.jdSource.value === "string" && state.jdSource.value.length > 0
    : state.jdSource.value instanceof File);
export const selectValidationErrors = (state: DocumentStore) =>
  state.validationErrors;
