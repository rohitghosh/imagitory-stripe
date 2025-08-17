// // /**
// //  * Injects variables into a template string by replacing placeholders
// //  * @param template - Template string with placeholders like `${variableName}`
// //  * @param variables - Object containing variable values
// //  * @returns - Template with variables injected
// //  */
// // export function injectVariables(
// //   template: string,
// //   variables: Record<string, any>,
// // ): string {
// //   let populated = template;
// //   for (const k in variables) {
// //     populated = populated.replaceAll(`\`\${${k}}\``, String(variables[k]));
// //   }
// //   return populated;
// // }

// // /**
// //  * Determines if a story has side characters
// //  * @param characters - Array of character names
// //  * @returns - True if there are side characters, false otherwise
// //  */
// // export function hasCharacters(characters?: string[]): boolean {
// //   return Boolean(characters && characters.length > 0);
// // }

// // /**
// //  * Validates that characters and characterDescriptions arrays have matching lengths
// //  * @param characters - Array of character names
// //  * @param characterDescriptions - Array of character descriptions
// //  * @returns - True if arrays match or both are empty/undefined
// //  */
// // export function validateCharacterArrays(
// //   characters?: string[],
// //   characterDescriptions?: string[],
// // ): boolean {
// //   const charLength = characters?.length || 0;
// //   const descLength = characterDescriptions?.length || 0;
// //   return charLength === descLength;
// // }

// // /**
// //  * Creates story inputs object for prompt injection
// //  * @param input - Story scene input
// //  * @returns - Object ready for template injection
// //  */
// // export function createStoryInputs(input: {
// //   kidName: string;
// //   pronoun: string;
// //   age: number;
// //   moral: string;
// //   kidInterests: string[];
// //   storyThemes: string[];
// //   storyRhyming: boolean;
// //   characters?: string[];
// //   characterDescriptions?: string[];
// // }) {
// //   const baseInputs = {
// //     kidName: input.kidName,
// //     pronoun: input.pronoun,
// //     age: input.age,
// //     moral: input.moral,
// //     kidInterest: input.kidInterests[0],
// //     storyTheme: input.storyThemes[0],
// //     storyRhyming: input.storyRhyming,
// //   };

// //   if (hasCharacters(input.characters)) {
// //     return {
// //       ...baseInputs,
// //       character1: input.characters![0],
// //       character1_description: input.characterDescriptions![0],
// //     };
// //   }

// //   return baseInputs;
// // }
// /**
//  * Injects variables into a template string by replacing placeholders
//  * @param template - Template string with placeholders like `${variableName}`
//  * @param variables - Object containing variable values
//  * @returns - Template with variables injected
//  */
// export function injectVariables(
//   template: string,
//   variables: Record<string, any>,
// ): string {
//   let populated = template;
//   for (const k in variables) {
//     populated = populated.replaceAll(`\`\${${k}}\``, String(variables[k]));
//   }
//   return populated;
// }

// /**
//  * Determines if a story has side characters
//  * @param characters - Array of character names
//  * @returns - True if there are side characters, false otherwise
//  */
// export function hasCharacters(characters?: string[]): boolean {
//   return Boolean(characters && characters.length > 0);
// }

// /**
//  * Gets the number of additional characters (excluding the main character)
//  * @param characters - Array of character names
//  * @returns - Number of additional characters (0-3)
//  */
// export function getCharacterCount(characters?: string[]): number {
//   return characters?.length || 0;
// }

// /**
//  * Validates that characters and characterDescriptions arrays have matching lengths
//  * @param characters - Array of character names
//  * @param characterDescriptions - Array of character descriptions
//  * @returns - True if arrays match or both are empty/undefined
//  */
// export function validateCharacterArrays(
//   characters?: string[],
//   characterDescriptions?: string[],
// ): boolean {
//   const charLength = characters?.length || 0;
//   const descLength = characterDescriptions?.length || 0;
//   return charLength === descLength;
// }

// /**
//  * Validates that the number of characters doesn't exceed the maximum limit
//  * @param characters - Array of character names
//  * @param maxCharacters - Maximum number of additional characters allowed (default: 3)
//  * @returns - True if within limit
//  */
// export function validateCharacterLimit(
//   characters?: string[],
//   maxCharacters: number = 3,
// ): boolean {
//   const charCount = getCharacterCount(characters);
//   return charCount <= maxCharacters;
// }

// /**
//  * Creates story inputs object for prompt injection with support for multiple characters
//  * @param input - Story scene input
//  * @returns - Object ready for template injection
//  */
// export function createStoryInputs(input: {
//   kidName: string;
//   pronoun: string;
//   age: number;
//   moral: string;
//   kidInterests: string[];
//   storyThemes: string[];
//   storyRhyming: boolean;
//   characters?: string[];
//   characterDescriptions?: string[];
// }) {
//   const baseInputs = {
//     kidName: input.kidName,
//     pronoun: input.pronoun,
//     age: input.age,
//     moral: input.moral,
//     kidInterest: input.kidInterests[0],
//     storyTheme: input.storyThemes[0],
//     storyRhyming: input.storyRhyming,
//   };

//   if (hasCharacters(input.characters)) {
//     const characterInputs: Record<string, any> = { ...baseInputs };

//     // Add character variables dynamically (up to 3 additional characters)
//     const characterCount = Math.min(input.characters!.length, 3);

//     for (let i = 0; i < characterCount; i++) {
//       const charIndex = i + 1;
//       characterInputs[`character${charIndex}`] = input.characters![i];
//       characterInputs[`character${charIndex}_description`] =
//         input.characterDescriptions![i];
//     }

//     return characterInputs;
//   }

//   return baseInputs;
// }

// /**
//  * Determines if the story should use the unified prompt (multiple characters) or legacy prompts
//  * @param characters - Array of character names
//  * @returns - True if should use unified prompt
//  */
// export function shouldUseUnifiedPrompt(characters?: string[]): boolean {
//   return hasCharacters(characters);
// }

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
 * Gets the number of additional characters (excluding the main character)
 * @param characters - Array of character names
 * @returns - Number of additional characters (0-3)
 */
export function getCharacterCount(characters?: string[]): number {
  return characters?.length || 0;
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
 * Validates that the number of characters doesn't exceed the maximum limit
 * @param characters - Array of character names
 * @param maxCharacters - Maximum number of additional characters allowed (default: 3)
 * @returns - True if within limit
 */
export function validateCharacterLimit(
  characters?: string[],
  maxCharacters: number = 3,
): boolean {
  const charCount = getCharacterCount(characters);
  return charCount <= maxCharacters;
}

/**
 * Creates story inputs object for prompt injection with support for multiple characters
 * @param input - Story scene input
 * @returns - Object ready for template injection
 */
export function createStoryInputs(input: {
  kidName: string;
  pronoun: string;
  age: number;
  theme: string;
  subject: string;
  storyRhyming: boolean;
  characters?: string[];
  characterDescriptions?: string[];
}) {
  const baseInputs = {
    kidName: input.kidName,
    pronoun: input.pronoun,
    age: input.age,
    theme: input.theme,
    subject: input.subject,
    storyRhyming: input.storyRhyming,
  };

  if (hasCharacters(input.characters)) {
    const characterInputs: Record<string, any> = { ...baseInputs };

    // Add character variables dynamically (up to 3 additional characters)
    const characterCount = Math.min(input.characters!.length, 3);

    for (let i = 0; i < characterCount; i++) {
      const charIndex = i + 1;
      characterInputs[`character${charIndex}`] = input.characters![i];
      characterInputs[`character${charIndex}_description`] =
        input.characterDescriptions![i];
    }

    return characterInputs;
  }

  return baseInputs;
}

/**
 * Determines if the story should use the unified prompt (multiple characters) or legacy prompts
 * @param characters - Array of character names
 * @returns - True if should use unified prompt
 */
export function shouldUseUnifiedPrompt(characters?: string[]): boolean {
  return hasCharacters(characters);
}
