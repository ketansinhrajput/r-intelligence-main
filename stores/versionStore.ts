/**
 * Version Store
 * Manages version history for generated resumes and cover letters
 */

import { create } from "zustand";
import type { GeneratedResume, GeneratedCoverLetter } from "@/types/resume";
import { v4 as uuidv4 } from "uuid";

interface Version {
  id: string;
  version: number;
  createdAt: string;
  resume: GeneratedResume;
  coverLetter: GeneratedCoverLetter | null;
  label: string;
  isEdited: boolean;
}

interface VersionState {
  versions: Version[];
  currentVersionId: string | null;
}

interface VersionActions {
  addVersion: (
    resume: GeneratedResume,
    coverLetter: GeneratedCoverLetter | null,
    label?: string
  ) => string;
  updateVersion: (
    versionId: string,
    updates: {
      resume?: GeneratedResume;
      coverLetter?: GeneratedCoverLetter | null;
      label?: string;
    }
  ) => void;
  deleteVersion: (versionId: string) => void;
  setCurrentVersion: (versionId: string | null) => void;
  getCurrentVersion: () => Version | null;
  getVersion: (versionId: string) => Version | null;
  markAsEdited: (versionId: string) => void;
  reset: () => void;
}

type VersionStore = VersionState & VersionActions;

const initialState: VersionState = {
  versions: [],
  currentVersionId: null,
};

export const useVersionStore = create<VersionStore>((set, get) => ({
  ...initialState,

  addVersion: (resume, coverLetter, label) => {
    const id = uuidv4();
    const versionNumber = get().versions.length + 1;
    const newVersion: Version = {
      id,
      version: versionNumber,
      createdAt: new Date().toISOString(),
      resume,
      coverLetter,
      label: label ?? `Version ${versionNumber}`,
      isEdited: false,
    };

    set((state) => ({
      versions: [...state.versions, newVersion],
      currentVersionId: id,
    }));

    return id;
  },

  updateVersion: (versionId, updates) => {
    set((state) => ({
      versions: state.versions.map((v) =>
        v.id === versionId
          ? {
              ...v,
              ...updates,
              isEdited: true,
            }
          : v
      ),
    }));
  },

  deleteVersion: (versionId) => {
    set((state) => {
      const filteredVersions = state.versions.filter((v) => v.id !== versionId);
      const newCurrentId =
        state.currentVersionId === versionId
          ? filteredVersions[filteredVersions.length - 1]?.id ?? null
          : state.currentVersionId;

      return {
        versions: filteredVersions,
        currentVersionId: newCurrentId,
      };
    });
  },

  setCurrentVersion: (versionId) => {
    set({ currentVersionId: versionId });
  },

  getCurrentVersion: () => {
    const state = get();
    if (!state.currentVersionId) return null;
    return state.versions.find((v) => v.id === state.currentVersionId) ?? null;
  },

  getVersion: (versionId) => {
    return get().versions.find((v) => v.id === versionId) ?? null;
  },

  markAsEdited: (versionId) => {
    set((state) => ({
      versions: state.versions.map((v) =>
        v.id === versionId ? { ...v, isEdited: true } : v
      ),
    }));
  },

  reset: () => {
    set(initialState);
  },
}));

// Selectors
export const selectVersions = (state: VersionStore) => state.versions;
export const selectCurrentVersionId = (state: VersionStore) => state.currentVersionId;
export const selectVersionCount = (state: VersionStore) => state.versions.length;
export const selectHasVersions = (state: VersionStore) => state.versions.length > 0;
export const selectLatestVersion = (state: VersionStore) =>
  state.versions[state.versions.length - 1] ?? null;
export const selectVersionById = (versionId: string) => (state: VersionStore) =>
  state.versions.find((v) => v.id === versionId) ?? null;
