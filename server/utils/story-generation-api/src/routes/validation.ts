import { Request, Response } from "express";
import { ValidationRequest, ValidationResponse } from "../types";
import { runStoryValidation, runStoryValidationStream } from "../services/validation";

/**
 * Validates story inputs for feasibility
 * POST /api/runValidation
 */
// export async function validateStoryInputs(
//   req: Request,
//   res: Response,
// ): Promise<void> {
//   try {
//     const {
//       kidName,
//       pronoun,
//       age,
//       moral,
//       kidInterests,
//       storyThemes,
//       characters,
//       character_descriptions,
//     }: ValidationRequest = req.body;

//     // Validate required fields
//     if (
//       !kidName ||
//       !pronoun ||
//       !age ||
//       !moral ||
//       !kidInterests ||
//       !storyThemes
//     ) {
//       res.status(400).json({
//         success: false,
//         error:
//           "Missing required fields: kidName, pronoun, age, moral, kidInterests, storyThemes",
//       });
//       return;
//     }

//     // Validate arrays
//     if (!Array.isArray(kidInterests) || kidInterests.length === 0) {
//       res.status(400).json({
//         success: false,
//         error: "kidInterests must be a non-empty array",
//       });
//       return;
//     }

//     if (!Array.isArray(storyThemes) || storyThemes.length === 0) {
//       res.status(400).json({
//         success: false,
//         error: "storyThemes must be a non-empty array",
//       });
//       return;
//     }

//     // Validate character consistency
//     // const hasCharacter1 = Boolean(character1);
//     // const hasCharacter1Description = Boolean(character1_description);

//     // if (hasCharacter1 !== hasCharacter1Description) {
//     //   res.status(400).json({
//     //     success: false,
//     //     error:
//     //       "If character1 is provided, character1_description must also be provided, and vice versa",
//     //   });
//     //   return;
//     // }

//     // Character array consistency validation
//     const hasCharacters = Array.isArray(characters) && characters.length > 0;
//     const hasCharacterDescriptions =
//       Array.isArray(character_descriptions) &&
//       character_descriptions.length > 0;

//     // If either is present, both must be present & lengths must match
//     if (hasCharacters !== hasCharacterDescriptions) {
//       res.status(400).json({
//         success: false,
//         error:
//           "If characters are provided, character_descriptions must also be provided and vice versa.",
//       });
//       return;
//     }

//     if (
//       hasCharacters &&
//       hasCharacterDescriptions &&
//       characters.length !== character_descriptions.length
//     ) {
//       res.status(400).json({
//         success: false,
//         error:
//           "The number of characters must match the number of character_descriptions.",
//       });
//       return;
//     }
    
//     // Run validation
//     const failures = await runStoryValidation({
//       kidName,
//       pronoun,
//       age,
//       moral,
//       kidInterests,
//       storyThemes,
//       characters,
//       character_descriptions,
//     });

//     const response: ValidationResponse = {
//       success: failures.length === 0,
//       failures,
//     };

//     res.json(response);
//   } catch (error) {
//     console.error("Validation error:", error);
//     res.status(500).json({
//       success: false,
//       error:
//         error instanceof Error
//           ? error.message
//           : "Unknown error occurred during validation",
//     });
//   }
// }


export async function validateStoryInputs(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      kidName,
      pronoun,
      age,
      moral,
      kidInterests,
      storyThemes,
      characters,
      character_descriptions,
    }: ValidationRequest = req.body;

    // Validate required fields
    if (
      !kidName ||
      !pronoun ||
      !age ||
      !moral ||
      !kidInterests ||
      !storyThemes
    ) {
      res.status(400).json({
        success: false,
        error:
          "Missing required fields: kidName, pronoun, age, moral, kidInterests, storyThemes",
      });
      return;
    }

    // Validate arrays
    if (!Array.isArray(kidInterests) || kidInterests.length === 0) {
      res.status(400).json({
        success: false,
        error: "kidInterests must be a non-empty array",
      });
      return;
    }

    if (!Array.isArray(storyThemes) || storyThemes.length === 0) {
      res.status(400).json({
        success: false,
        error: "storyThemes must be a non-empty array",
      });
      return;
    }

    // Character array consistency validation
    const hasCharacters = Array.isArray(characters) && characters.length > 0;
    const hasCharacterDescriptions =
      Array.isArray(character_descriptions) &&
      character_descriptions.length > 0;

    // If either is present, both must be present & lengths must match
    if (hasCharacters !== hasCharacterDescriptions) {
      res.status(400).json({
        success: false,
        error:
          "If characters are provided, character_descriptions must also be provided and vice versa.",
      });
      return;
    }

    if (
      hasCharacters &&
      hasCharacterDescriptions &&
      characters.length !== character_descriptions.length
    ) {
      res.status(400).json({
        success: false,
        error:
          "The number of characters must match the number of character_descriptions.",
      });
      return;
    }

     await runStoryValidationStream(req.body, res);

  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred during validation",
    });
  }
}
