// Re-export theme and subject types
export * from "./ThemeSubjects";
import { getThemeById } from "./ThemeSubjects";

// Story Generation Schema - provides label/value pairs for themes and subjects
// This enables conditional logic downstream in the story generation process

export interface ThemeSubjectSchema {
  theme: {
    label: string;
    value: string;
    isCustom: boolean;
  };
  subject: {
    label: string;
    value: string;
    isCustom: boolean;
  };
}

// Helper function to create schema from theme and subject selection
export function createThemeSubjectSchema(
  selectedTheme: string,
  isCustomTheme: boolean,
  selectedSubject: string,
  isCustomSubject?: boolean,
): ThemeSubjectSchema {
  return {
    theme: {
      label: isCustomTheme ? "Custom" : getThemeDisplayName(selectedTheme),
      value: selectedTheme,
      isCustom: isCustomTheme,
    },
    subject: {
      label: isCustomSubject ? "Custom Subject" : selectedSubject,
      value: selectedSubject,
      isCustom: isCustomSubject || isCustomTheme, // Custom themes always have custom subjects
    },
  };
}

// Helper function to get display name for predefined themes
function getThemeDisplayName(themeId: string): string {
  const theme = getThemeById(themeId);
  return theme?.name || themeId;
}

// Helper to determine if validation is required
export function requiresValidation(schema: ThemeSubjectSchema): boolean {
  return schema.theme.isCustom || schema.subject.isCustom;
}

// Export for use in components and API calls
export type StoryCreationContext = {
  themeSubjectSchema: ThemeSubjectSchema;
  validationRequired: boolean;
  validationPassed?: boolean;
};
