/**
 * Prompt Templates Index
 * Re-exports all prompt templates for easy import
 */

export {
  PARSE_RESUME_SYSTEM_PROMPT,
  PARSE_RESUME_PROMPT,
  buildParseResumePrompt,
} from "./parseResume";

export {
  PARSE_JD_SYSTEM_PROMPT,
  PARSE_JD_PROMPT,
  buildParseJdPrompt,
} from "./parseJd";

export {
  DETECT_FAKE_JD_SYSTEM_PROMPT,
  DETECT_FAKE_JD_PROMPT,
  buildDetectFakeJdPrompt,
} from "./detectFakeJd";

export {
  MATCH_ANALYSIS_SYSTEM_PROMPT,
  MATCH_ANALYSIS_PROMPT,
  buildMatchAnalysisPrompt,
} from "./matchAnalysis";

export {
  ATS_SCORING_SYSTEM_PROMPT,
  ATS_SCORING_PROMPT,
  buildAtsScoringPrompt,
} from "./atsScoring";

export {
  REWRITE_RESUME_SYSTEM_PROMPT,
  REWRITE_RESUME_PROMPT,
  buildRewriteResumePrompt,
} from "./rewriteResume";

export {
  GENERATE_COVER_LETTER_SYSTEM_PROMPT,
  GENERATE_COVER_LETTER_PROMPT,
  buildGenerateCoverLetterPrompt,
} from "./generateCoverLetter";

export {
  VALIDATE_OUTPUT_SYSTEM_PROMPT,
  VALIDATE_OUTPUT_PROMPT,
  buildValidateOutputPrompt,
} from "./validateOutput";
