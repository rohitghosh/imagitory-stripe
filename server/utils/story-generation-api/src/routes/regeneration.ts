import { Request, Response } from "express";
import {
  regenerateSceneImage,
  regenerateCoverImage,
  regenerateBaseCoverImage,
  generateFinalCoverWithTitle,
} from "../services/imageGeneration";

// POST /api/regenerateScene
export async function regenerateScene(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { scene_inputs, new_seed } = req.body;

    if (!scene_inputs) {
      res.status(400).json({ error: "scene_inputs is required" });
      return;
    }

    const newImageUrl = await regenerateSceneImage(scene_inputs, new_seed);

    res.json({
      success: true,
      new_scene_url: newImageUrl,
      seed_used: new_seed ?? scene_inputs.seed ?? 3,
    });
  } catch (error) {
    console.error("Scene regeneration error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

// // POST /api/regenerateCover
// export async function regenerateCover(
//   req: Request,
//   res: Response,
// ): Promise<void> {
//   try {
//     const { cover_inputs, new_seed } = req.body;

//     if (!cover_inputs) {
//       res.status(400).json({ error: "cover_inputs is required" });
//       return;
//     }

//     const newImageUrl = await regenerateCoverImage(cover_inputs, new_seed);

//     res.json({
//       success: true,
//       new_cover_url: newImageUrl,
//       seed_used: new_seed ?? cover_inputs.seed ?? 3,
//     });
//   } catch (error) {
//     console.error("Cover regeneration error:", error);
//     res.status(500).json({
//       error: error instanceof Error ? error.message : "Unknown error occurred",
//     });
//   }
// }

export async function regenerateBaseCover(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { base_cover_inputs, new_seed } = req.body;

    if (!base_cover_inputs) {
      res.status(400).json({ error: "base_cover_inputs is required" });
      return;
    }

    const newBaseCoverUrl = await regenerateBaseCoverImage(
      base_cover_inputs,
      new_seed,
    );

    res.json({
      success: true,
      new_base_cover_url: newBaseCoverUrl,
      seed_used: new_seed ?? base_cover_inputs.seed ?? 3,
    });
  } catch (error) {
    console.error("Base cover regeneration error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

// POST /api/regenerateFinalCover
export async function regenerateFinalCover(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { final_cover_inputs, new_seed } = req.body;

    if (!final_cover_inputs) {
      res.status(400).json({ error: "final_cover_inputs is required" });
      return;
    }

    const newFinalCoverUrl = await regenerateFinalCover(
      final_cover_inputs,
      new_seed,
    );

    res.json({
      success: true,
      new_final_cover_url: newFinalCoverUrl,
      seed_used: new_seed ?? final_cover_inputs.seed ?? 3,
    });
  } catch (error) {
    console.error("Final cover regeneration error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

// POST /api/regenerateFullCover (regenerate both base and final)
export async function regenerateFullCover(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { base_cover_inputs, story_title, new_seed } = req.body;

    if (!base_cover_inputs || !story_title) {
      res
        .status(400)
        .json({ error: "base_cover_inputs and story_title are required" });
      return;
    }

    const seedToUse = new_seed ?? base_cover_inputs.seed ?? 3;

    // Regenerate base cover first
    const newBaseCoverUrl = await regenerateBaseCover(
      base_cover_inputs,
      seedToUse,
    );

    // Then add title to create final cover
    const newFinalCoverUrl = await generateFinalCoverWithTitle(
      newBaseCoverUrl,
      story_title,
      seedToUse,
    );

    res.json({
      success: true,
      new_base_cover_url: newBaseCoverUrl,
      new_final_cover_url: newFinalCoverUrl,
      seed_used: seedToUse,
    });
  } catch (error) {
    console.error("Full cover regeneration error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
