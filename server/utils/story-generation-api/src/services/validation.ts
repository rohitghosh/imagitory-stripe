// import OpenAI from "openai";
// import { zodTextFormat } from "openai/helpers/zod";
// import {
//   StoryValidationInput,
//   ValidationFailure,
//   ProgressCallback,
//   storyValidationResponseSchema,
// } from "../types";
// import { UNIFIED_VALIDATION_PROMPT } from "../utils/prompts";
// import { hasCharacters } from "../utils/helpers";

// const openai = new OpenAI();

// export function buildValidationPrompt(input: StoryValidationInput) {
//   const hasCharacters =
//     Array.isArray(input.characters) &&
//     input.characters.length > 0 &&
//     Array.isArray(input.character_descriptions) &&
//     input.character_descriptions.length > 0 &&
//     input.characters.length === input.character_descriptions.length;

//   let userPrompt = `
//     You are a Story Feasibility Analyst. Follow all rules and checks from the System Prompt to validate the following story idea.

//     **INPUTS FOR VALIDATION:**
//     * **kidName:** "${input.kidName}"
//     * **age:** ${input.age}
//     * **pronoun:** "${input.pronoun}"
//     * **moral:** "${input.moral}"
//     * **kidInterest:** "${input.kidInterests[0]}"
//     * **story_theme:** "${input.storyThemes[0]}"
//   `;

//   if (hasCharacters) {
//     userPrompt += `
//     * **character1:** "${input.characters[0]}"
//     * **character1_description:** "${input.character_descriptions[0]}"
//     `;
//   }

//   userPrompt += `
//     **TASK:**
//     Produce a single, valid JSON array as your entire output. The array must contain exactly ${hasCharacters ? "12" : "13"} JSON objects, one for each validation check performed in order, strictly following the output structure defined in the System Prompt. Add a "check_name" field to each object corresponding to the validation being performed. Do not write any other text.`;

//   return {
//     systemPrompt: UNIFIED_VALIDATION_PROMPT,
//     userPrompt,
//     schema: storyValidationResponseSchema, // Zod schema
//     hasCharacters,
//   };
// }

// /**
//  * Interface for validation input without character
//  */
// interface StoryValidationInputwoChar {
//   kidName: string;
//   pronoun: string;
//   age: number;
//   moral: string;
//   kidInterests: string[];
//   storyThemes: string[];
// }

// /**
//  * Runs story premise validation check using a structured prompt
//  * Automatically determines whether to use character or no-character validation
//  * @param input - The user-defined variables for the story premise
//  * @param onProgress - Optional callback to report progress
//  * @returns - Array of validation failures (empty if all pass)
//  */
// export async function runStoryValidation(
//   input: StoryValidationInput,
//   onProgress?: ProgressCallback,
// ): Promise<ValidationFailure[]> {
//   onProgress?.("validation", 5, "Assembling validation prompt…");

//   const { systemPrompt, userPrompt, schema } = buildValidationPrompt(input);

//   onProgress?.("validation", 25, "Calling AI servers for validation…");

//   const openaiRes = await openai.responses.parse({
//     model: "gpt-5-mini",
//     input: [
//       { role: "system", content: systemPrompt },
//       { role: "user", content: userPrompt },
//     ],
//     text: {
//       format: zodTextFormat(
//         storyValidationResponseSchema,
//         "validation_response",
//       ),
//     },
//   });

//   onProgress?.("validation", 75, "Parsing validation results…");

//   // Access the 'results' array inside the returned object
//   const validationResults = openaiRes.output_parsed.results;

//   if (!Array.isArray(validationResults)) {
//     throw new Error(
//       "Validation output did not contain the required check results.",
//     );
//   }

//   const failures: ValidationFailure[] = validationResults
//     .filter((result) => result.Validation === "Fail")
//     .map((failedResult) => ({
//       check: failedResult.check_name,
//       problem: failedResult.Problem,
//       solution: failedResult.Solution,
//     }));

//   onProgress?.("validation", 100, "Validation complete.");

//   return failures;
// }

// import { Response } from "express";

// export async function runStoryValidationStream(
//   input: StoryValidationInput,
//   res: Response, // send SSE directly
// ) {
//   const { systemPrompt, userPrompt, schema } = buildValidationPrompt(input);

//   // 🅐  prepare SSE headers
//   res.status(200).set({
//     "Content-Type": "text/event-stream",
//     "Cache-Control": "no-cache",
//     Connection: "keep-alive",
//   });
//   res.flushHeaders();

//   const abort = new AbortController();
//   res.on("close", () => abort.abort());

//   // 🅑  fire Responses API with streaming + reasoning summary
//   const stream = await openai.responses.create(
//     {
//       model: "gpt-5-mini",
//       stream: true,
//       input: [
//         { role: "system", content: systemPrompt },
//         { role: "user", content: userPrompt },
//       ],
//       text: {
//         format: zodTextFormat(
//           storyValidationResponseSchema,
//           "validation_response",
//         ),
//       },
//       reasoning: { summary: "detailed" },
//     },
//     { signal: abort.signal },
//   );

//   let jsonBuf = "";

//   for await (const ev of stream) {
//     if (ev.type === "response.reasoning_summary_text.delta") {
//       const safe = String(ev.delta).replace(/\n/g, "\ndata:");
//       res.write(`data:${safe}\n\n`); // live token
//       res.flush?.();
//     }
//     if (ev.type === "response.output_text.delta") {
//       jsonBuf += ev.delta; // collect JSON
//     }
//   }

//   // 🅒  convert to {success, failures}
//   let payload;
//   try {
//     const parsed = JSON.parse(jsonBuf);
//     const fails = parsed.results
//       .filter((r: any) => r.Validation === "Fail")
//       .map((r: any) => ({
//         check: r.check_name,
//         problem: r.Problem,
//         solution: r.Solution,
//       }));
//     payload = { success: fails.length === 0, failures: fails };
//   } catch (e) {
//     payload = { success: false, error: "bad-json" };
//   }

//   res.write(`event: result\ndata: ${JSON.stringify(payload)}\n\n`);
//   res.end();
// }

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  StoryValidationInput,
  ValidationFailure,
  ProgressCallback,
  storyValidationResponseSchema,
} from "../types";
import { createValidationPrompt } from "../utils/prompts";

const openai = new OpenAI();

export function buildValidationPrompt(input: StoryValidationInput) {
  const hasCharacters =
    Array.isArray(input.characters) &&
    input.characters.length > 0 &&
    Array.isArray(input.character_descriptions) &&
    input.character_descriptions.length > 0 &&
    input.characters.length === input.character_descriptions.length;

  let userPrompt = `
    You are a Story Feasibility Analyst. Follow all rules and checks from the System Prompt to validate the following story idea.

    **INPUTS FOR VALIDATION:**
    * **kidName:** "${input.kidName}"
    * **age:** ${input.age}
    * **pronoun:** "${input.pronoun}"
    * **theme:** "${input.theme}"
    * **subject:** "${input.subject}"
  `;

  if (hasCharacters) {
    userPrompt += `
    * **character1:** "${input.characters}"
    * **character1_description:** "${input.character_descriptions}"
    `;
  }

  userPrompt += `
    **TASK:**
    Produce a single, valid JSON array as your entire output. The array must contain exactly 9 JSON objects, one for each validation check performed in order, strictly following the output structure defined in the System Prompt. Add a "check_name" field to each object corresponding to the validation being performed. Do not write any other text.`;

  return {
    systemPrompt: createValidationPrompt(hasCharacters),
    userPrompt,
    schema: storyValidationResponseSchema, // Zod schema
    hasCharacters,
  };
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

  const { systemPrompt, userPrompt, schema } = buildValidationPrompt(input);

  onProgress?.("validation", 25, "Calling AI servers for validation…");

  const openaiRes = await openai.responses.parse({
    model: "gpt-5-mini",
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

import { Response } from "express";

export async function runStoryValidationStream(
  input: StoryValidationInput,
  res: Response, // send SSE directly
) {
  const { systemPrompt, userPrompt, schema } = buildValidationPrompt(input);

  // 🅐  prepare SSE headers
  res.status(200).set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const abort = new AbortController();
  res.on("close", () => abort.abort());

  // 🅑  fire Responses API with streaming + reasoning summary
  const stream = await openai.responses.create(
    {
      model: "gpt-5-mini",
      stream: true,
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
      reasoning: { summary: "detailed" },
    },
    { signal: abort.signal },
  );

  let jsonBuf = "";

  for await (const ev of stream) {
    if (ev.type === "response.reasoning_summary_text.delta") {
      const safe = String(ev.delta).replace(/\n/g, "\ndata:");
      res.write(`data:${safe}\n\n`); // live token
      res.flush?.();
    }
    if (ev.type === "response.output_text.delta") {
      jsonBuf += ev.delta; // collect JSON
    }
  }

  // 🅒  convert to {success, failures}
  let payload;
  try {
    const parsed = JSON.parse(jsonBuf);
    const fails = parsed.results
      .filter((r: any) => r.Validation === "Fail")
      .map((r: any) => ({
        check: r.check_name,
        problem: r.Problem,
        solution: r.Solution,
      }));
    payload = { success: fails.length === 0, failures: fails };
  } catch (e) {
    payload = { success: false, error: "bad-json" };
  }

  res.write(`event: result\ndata: ${JSON.stringify(payload)}\n\n`);
  res.end();
}
