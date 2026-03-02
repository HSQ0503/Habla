const isTestMode =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_TEST_MODE === "true"
    : process.env.NEXT_PUBLIC_TEST_MODE === "true";

export const TEST_MODE = isTestMode;

// Prep phase
export const PREP_SECONDS = isTestMode ? 30 : 15 * 60;
export const MIN_PREP_SECONDS = isTestMode ? 3 : 60;

// Presentation phase
export const MIN_PRESENT_SECONDS = isTestMode ? 3 : 60;

// Conversation phase
export const MIN_CONVERSE_SECONDS = isTestMode ? 5 : 5 * 60;
export const WARN_CONVERSE_SECONDS = isTestMode ? 15 : 10 * 60;
export const MAX_CONVERSE_SECONDS = isTestMode ? 20 : 12 * 60;
