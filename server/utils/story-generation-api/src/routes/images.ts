import { Request, Response } from "express";
import { 
  generateImage as orchestratorGenerateImage,
  regenerateImage as orchestratorRegenerateImage
} from "../core/orchestrator";
import { Part } from "../core/types";
import * as store from "../core/historyStore";

/**
 * Generate image
 * POST /api/images/generate
 */
export async function generateImage(req: Request, res: Response): Promise<void> {
  try {
    const {
      conversationId,
      provider = "openai",
      model,
      prompt_parts
    }: {
      conversationId: string;
      provider?: "openai" | "gemini";
      model?: string;
      prompt_parts: Part[];
    } = req.body;

    // Validate required fields
    if (!conversationId || !Array.isArray(prompt_parts) || prompt_parts.length === 0) {
      res.status(400).json({
        error: "Missing required fields: conversationId, prompt_parts",
      });
      return;
    }

    // Validate provider
    if (!["openai", "gemini"].includes(provider)) {
      res.status(400).json({
        error: "Invalid provider. Must be 'openai' or 'gemini'",
      });
      return;
    }

    const result = await orchestratorGenerateImage({
      conversationId,
      provider,
      model,
      prompt_parts
    });

    res.json({
      success: true,
      data: {
        jobId: result.jobId,
        images: result.images,
        provider_meta: result.provider_meta
      }
    });

  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Regenerate image
 * POST /api/images/regenerate
 */
export async function regenerateImage(req: Request, res: Response): Promise<void> {
  try {
    const {
      conversationId,
      jobId,
      revisedPrompt
    }: {
      conversationId: string;
      jobId: string;
      revisedPrompt?: string;
    } = req.body;

    // Validate required fields
    if (!conversationId || !jobId) {
      res.status(400).json({
        error: "Missing required fields: conversationId, jobId",
      });
      return;
    }

    const result = await orchestratorRegenerateImage({
      conversationId,
      jobId,
      revisedPrompt
    });

    res.json({
      success: true,
      data: {
        jobId: result.jobId,
        images: result.images,
        provider_meta: result.provider_meta
      }
    });

  } catch (error) {
    console.error("Image regeneration error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Get job status
 * GET /api/images/:conversationId/:jobId
 */
export async function getJobStatus(req: Request, res: Response): Promise<void> {
  try {
    const { conversationId, jobId } = req.params;

    if (!conversationId || !jobId) {
      res.status(400).json({ error: "Conversation ID and Job ID are required" });
      return;
    }

    const job = await store.loadJob(conversationId, jobId);

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error("Job status error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Get job artifacts
 * GET /api/images/:conversationId/:jobId/artifacts
 */
export async function getJobArtifacts(req: Request, res: Response): Promise<void> {
  try {
    const { conversationId, jobId } = req.params;

    if (!conversationId || !jobId) {
      res.status(400).json({ error: "Conversation ID and Job ID are required" });
      return;
    }

    const artifacts = await store.getJobArtifacts(conversationId, jobId);

    res.json({
      success: true,
      data: artifacts
    });

  } catch (error) {
    console.error("Job artifacts error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
