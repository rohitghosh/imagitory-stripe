import { Request, Response } from "express";
import { ValidationRequest, ValidationResponse } from "../types";
import { runStoryValidation } from "../services/validation";

/**
 * Validates story inputs for feasibility
 * POST /api/runValidation
 */
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
      character1,
      character1_description,
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

    // Validate character consistency
    const hasCharacter1 = Boolean(character1);
    const hasCharacter1Description = Boolean(character1_description);

    if (hasCharacter1 !== hasCharacter1Description) {
      res.status(400).json({
        success: false,
        error:
          "If character1 is provided, character1_description must also be provided, and vice versa",
      });
      return;
    }

    // Run validation
    const failures = await runStoryValidation({
      kidName,
      pronoun,
      age,
      moral,
      kidInterests,
      storyThemes,
      character1,
      character1_description,
    });

    const response: ValidationResponse = {
      success: failures.length === 0,
      failures,
    };

    res.json(response);
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
