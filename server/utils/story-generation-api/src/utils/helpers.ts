/**
 * Injects variables into a template string by replacing placeholders
 * @param template - Template string with placeholders like `${variableName}`
 * @param variables - Object containing variable values
 * @returns - Template with variables injected
 */
export function injectVariables(
  template: string,
  variables: Record<string, any>,
): string {
  let populated = template;
  for (const k in variables) {
    populated = populated.replaceAll(`\`\${${k}}\``, String(variables[k]));
  }
  return populated;
}

/**
 * Determines if a story has side characters
 * @param characters - Array of character names
 * @returns - True if there are side characters, false otherwise
 */
export function hasCharacters(characters?: string[]): boolean {
  return Boolean(characters && characters.length > 0);
}

/**
 * Validates that characters and characterDescriptions arrays have matching lengths
 * @param characters - Array of character names
 * @param characterDescriptions - Array of character descriptions
 * @returns - True if arrays match or both are empty/undefined
 */
export function validateCharacterArrays(
  characters?: string[],
  characterDescriptions?: string[],
): boolean {
  const charLength = characters?.length || 0;
  const descLength = characterDescriptions?.length || 0;
  return charLength === descLength;
}

/**
 * Creates story inputs object for prompt injection
 * @param input - Story scene input
 * @returns - Object ready for template injection
 */
export function createStoryInputs(input: {
  kidName: string;
  pronoun: string;
  age: number;
  moral: string;
  kidInterests: string[];
  storyThemes: string[];
  storyRhyming: boolean;
  characters?: string[];
  characterDescriptions?: string[];
}) {
  const baseInputs = {
    kidName: input.kidName,
    pronoun: input.pronoun,
    age: input.age,
    moral: input.moral,
    kidInterest: input.kidInterests[0],
    storyTheme: input.storyThemes[0],
    storyRhyming: input.storyRhyming,
  };

  if (hasCharacters(input.characters)) {
    return {
      ...baseInputs,
      character1: input.characters![0],
      character1_description: input.characterDescriptions![0],
    };
  }

  return baseInputs;
}
