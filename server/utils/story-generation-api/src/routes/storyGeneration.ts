import { Request, Response } from "express";
import { StoryGenerationRequest, StoryGenerationResponse } from "../types";
import { generateCompleteStory } from "../services/storyGeneration";
import { jobTracker } from "../services/jobTracker";
import { validateCharacterArrays } from "../utils/helpers";
import { DEFAULT_CHARACTER_IMAGES } from "../utils/constants";

/**
 * Generates a complete story with images
 * POST /api/generateFullStory
 */
export async function generateFullStory(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      kidName,
      pronoun,
      age,
      moral,
      storyRhyming,
      kidInterests,
      storyThemes,
      characters = [],
      characterDescriptions = [],
      characterImageMap = DEFAULT_CHARACTER_IMAGES,
    }: StoryGenerationRequest = req.body;

    // Validate required fields
    if (
      !kidName ||
      !pronoun ||
      age === undefined ||
      !moral ||
      storyRhyming === undefined ||
      !kidInterests ||
      !storyThemes
    ) {
      res.status(400).json({
        error:
          "Missing required fields: kidName, pronoun, age, moral, storyRhyming, kidInterests, storyThemes",
      });
      return;
    }

    // Validate arrays
    if (!Array.isArray(kidInterests) || kidInterests.length === 0) {
      res.status(400).json({
        error: "kidInterests must be a non-empty array",
      });
      return;
    }

    if (!Array.isArray(storyThemes) || storyThemes.length === 0) {
      res.status(400).json({
        error: "storyThemes must be a non-empty array",
      });
      return;
    }

    // Validate character arrays
    if (!validateCharacterArrays(characters, characterDescriptions)) {
      res.status(400).json({
        error:
          "characters and characterDescriptions arrays must have the same length",
      });
      return;
    }

    // Currently support max 1 side character
    if (characters.length > 1) {
      res.status(400).json({
        error: "Currently only 0 or 1 side character is supported",
      });
      return;
    }

    // Create a new job
    const jobId = jobTracker.newJob();

    // Respond immediately with job ID
    const response: StoryGenerationResponse = { jobId };
    res.status(202).json(response);

    // Start story generation in background
    (async () => {
      try {
        jobTracker.set(jobId, {
          phase: "initializing",
          pct: 0,
          message: "Starting story generation...",
        });

        const storyPackage = await generateCompleteStory(
          {
            kidName,
            pronoun,
            age,
            moral,
            storyRhyming,
            kidInterests,
            storyThemes,
            characters,
            characterDescriptions,
          },
          characterImageMap,
          (phase, pct, message) => {
            jobTracker.set(jobId, { phase, pct, message });
          },
        );

        // Mark job as complete with result
        jobTracker.set(jobId, {
          phase: "complete",
          pct: 100,
          message: "Story generation complete",
          result: storyPackage,
        });
      } catch (error) {
        console.error(`Story generation error for job ${jobId}:`, error);
        jobTracker.set(jobId, {
          phase: "error",
          pct: 100,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error occurred during story generation",
        });
      }
    })();
  } catch (error) {
    console.error("Story generation request error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Get job status
 * GET /api/job/:jobId
 */
export function getJobStatus(req: Request, res: Response): void {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({ error: "Job ID is required" });
      return;
    }

    const status = jobTracker.get(jobId);

    if (!status) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    res.json(status);
  } catch (error) {
    console.error("Job status error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
