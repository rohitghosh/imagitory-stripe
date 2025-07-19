import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  StoryValidationInput,
  ValidationFailure,
  ProgressCallback,
  storyValidationResponseSchema,
} from "../types";
import {
  STORY_VALIDATION_PROMPT,
  STORY_VALIDATION_PROMPT_WITHOUT_CHARACTER,
} from "../utils/prompts";
import { hasCharacters } from "../utils/helpers";

const openai = new OpenAI();

/**
 * Interface for validation input without character
 */
interface StoryValidationInputwoChar {
  kidName: string;
  pronoun: string;
  age: number;
  moral: string;
  kidInterests: string[];
  storyThemes: string[];
}

/**
 * Runs story premise validation check using a structured prompt
 * Automatically determines whether to use character or no-character validation
 * @param input - The user-defined variables for the story premise
 * @param onProgress - Optional callback to report progress
 * @returns - Array of validation failures (empty if all pass)
 */
export async function runStoryValidation(
  input: StoryValidationInput,
  onProgress?: ProgressCallback,
): Promise<ValidationFailure[]> {
  onProgress?.("validation", 5, "Assembling validation prompt…");

  // Determine if a secondary character is present
  const hasCharacter1 = Boolean(
    input.character1 && input.character1_description,
  );

  const systemPrompt = hasCharacter1
    ? STORY_VALIDATION_PROMPT
    : STORY_VALIDATION_PROMPT_WITHOUT_CHARACTER;

  // Build the user prompt based on the input structure
  let userPrompt = `
    You are a Story Feasibility Analyst. Follow all rules and checks from the System Prompt to validate the following story idea.

    **INPUTS FOR VALIDATION:**
    * **kidName:** "${input.kidName}"
    * **age:** ${input.age}
    * **pronoun:** "${input.pronoun}"
    * **moral:** "${input.moral}"
    * **kidInterest:** "${input.kidInterests[0]}"
    * **story_theme:** "${input.storyThemes[0]}"
  `;

  if (hasCharacter1) {
    userPrompt += `
    * **character1:** "${input.character1}"
    * **character1_description:** "${input.character1_description}"
    `;
  }

  userPrompt += `
    **TASK:**
    Produce a single, valid JSON array as your entire output. The array must contain exactly ${hasCharacter1 ? "12" : "13"} JSON objects, one for each validation check performed in order, strictly following the output structure defined in the System Prompt. Add a "check_name" field to each object corresponding to the validation being performed. Do not write any other text.
  `;

  onProgress?.("validation", 25, "Calling AI servers for validation…");

  const openaiRes = await openai.responses.parse({
    model: "o4-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: {
      format: zodTextFormat(
        storyValidationResponseSchema,
        "validation_response",
      ),
    },
  });

  onProgress?.("validation", 75, "Parsing validation results…");

  // Access the 'results' array inside the returned object
  const validationResults = openaiRes.output_parsed.results;

  if (!Array.isArray(validationResults)) {
    throw new Error(
      "Validation output did not contain the required check results.",
    );
  }

  const failures: ValidationFailure[] = validationResults
    .filter((result) => result.Validation === "Fail")
    .map((failedResult) => ({
      check: failedResult.check_name,
      problem: failedResult.Problem,
      solution: failedResult.Solution,
    }));

  onProgress?.("validation", 100, "Validation complete.");

  return failures;
}
