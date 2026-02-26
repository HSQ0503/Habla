export type ChatMessage = {
  role: "student" | "examiner" | "presentation";
  content: string;
  timestamp: string;
  wordCount?: number;
};

export type AiAnalysis = {
  description?: string;
  culturalContext?: string;
  themes?: string[];
  talkingPoints?: string[];
  deeperQuestions?: string[];
  vocabularyHints?: string[];
  suggestedTheme?: string;
};

export type ConversationMetrics = {
  totalStudentWords: number;
  totalStudentMessages: number;
  totalExaminerMessages: number;
  averageResponseLength: number;
  conversationStartedAt: string;
  lastMessageAt: string;
};

// IB Grading types

export type CriterionGrade = {
  mark: number;
  band: string;
  justification: string;
  strengths: string[];
  improvements: string[];
};

export type IBGrades = {
  criterionA: CriterionGrade;
  criterionB1: CriterionGrade;
  criterionB2: CriterionGrade;
  criterionC: CriterionGrade;
  totalMark: number;
  overallSummary: string;
  topStrengths: string[];
  priorityImprovements: string[];
};

// Quantitative analysis types

export type TenseEntry = {
  tense: string;
  count: number;
  examples: string[];
};

export type TenseAnalysis = {
  tensesFound: TenseEntry[];
  totalTensesUsed: number;
  varietyScore: number;
  missingTenses: string[];
  dominantTense: string;
};

export type FactorScore = {
  name: string;
  score: number;
  count: number;
};

export type DepthAnalysis = {
  overallScore: number;
  factorScores: FactorScore[];
  averageResponseLength: number;
  strongestFactor: string;
  weakestFactor: string;
};

export type VocabularyAnalysis = {
  estimatedLevel: string;
  lexicalDiversity: number;
  wordDistribution: { level: string; count: number; percentage: number }[];
  advancedWords: string[];
  complexityScore: number;
};

export type PaceAnalysis = {
  overallWPM: number;
  presentationWPM: number;
  conversationWPM: number;
  paceVariability: number;
  fluencyRating: string;
  fluencyScore: number;
};

export type FeedbackResult = {
  ibGrades: IBGrades;
  quantitative: {
    tenses: TenseAnalysis;
    depth: DepthAnalysis;
    vocabulary: VocabularyAnalysis;
    pace: PaceAnalysis;
  };
};
