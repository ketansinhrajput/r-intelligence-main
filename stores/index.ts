/**
 * Store Exports
 * Central export for all Zustand stores
 */

export {
  useDocumentStore,
  selectResumeFile,
  selectCoverLetterFile,
  selectJdSource,
  selectUserOptions,
  selectIsValid,
  selectValidationErrors,
} from "./documentStore";

export {
  useAnalysisStore,
  selectStatus,
  selectProgress,
  selectParsedResume,
  selectParsedJd,
  selectMatchingAnalysis,
  selectAtsScores,
  selectRiskAnalysis,
  selectGeneratedResume,
  selectGeneratedCoverLetter,
  selectFullAnalysis,
  selectErrors,
  selectErrorMessage,
  selectJdQualityWarning,
  selectIsAnalyzing,
  selectHasResults,
  selectOverallScore,
} from "./analysisStore";

export {
  useVersionStore,
  selectVersions,
  selectCurrentVersionId,
  selectVersionCount,
  selectHasVersions,
  selectLatestVersion,
  selectVersionById,
} from "./versionStore";

export {
  useLLMConfigStore,
  selectLLMConfig,
  selectIsLLMConfigured,
  type LLMProviderConfig,
} from "./llmConfigStore";
