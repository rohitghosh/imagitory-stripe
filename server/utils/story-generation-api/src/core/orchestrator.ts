import { openaiImageEngine } from "../engines/openaiImageEngine";
import { geminiImageEngine } from "../engines/geminiImageEngine";
import {
  Part,
  ImageGenConfig,
  ImageEngine,
  ImageArtifact,
  GenerationResult,
  ProgressCallback,
  ConversationTurn,
  ImageJob,
} from "./types";
import * as store from "./historyStore";
import { saveBufferToStorage, getExtensionFromMime } from "./storage";
import { generateRequestHash } from "./hashing";

/**
 * Generate a child job ID for regenerations
 */
export function generateChildJobId(
  parentJobId: string,
  regenerationIndex: number,
): string {
  return `${parentJobId}_regen_${regenerationIndex}`;
}

/**
 * Extract parent job ID from a regeneration job ID
 */
export function getParentJobId(jobId: string): string {
  if (jobId.includes("_regen_")) {
    return jobId.split("_regen_")[0];
  }
  return jobId;
}

/**
 * Get the regeneration index from a job ID
 */
export function getRegenerationIndex(jobId: string): number {
  if (jobId.includes("_regen_")) {
    const parts = jobId.split("_regen_");
    return parseInt(parts[1], 10);
  }
  return 0;
}

/**
 * Build conversation history for regeneration
 */
export async function buildConversationHistory(
  conversationId: string,
  parentJobId: string,
  newPrompt: string,
): Promise<ConversationTurn[]> {
  const parentJob = await store.loadJob(conversationId, parentJobId);
  if (!parentJob) {
    throw new Error(`Parent job ${parentJobId} not found`);
  }

  const history: ConversationTurn[] = [];

  // Add parent job's conversation history if it exists (for chained regenerations)
  if (parentJob.conversation_history) {
    history.push(...parentJob.conversation_history);
  } else {
    // First time: add original input as user message
    history.push({
      role: "user" as const,
      parts: parentJob.input_snapshot.prompt_parts,
    });
  }

  // Add parent job's output as model response (both text AND images)
  const modelResponseParts: Part[] = [
    ...(parentJob.output_summary?.text
      ? [{ type: "text" as const, text: parentJob.output_summary.text }]
      : []),
    ...(parentJob.output_summary?.images || []).map((img) => ({
      type: "image_url" as const,
      url: img.url,
      mimeType: img.mimeType,
    })),
  ];

  if (modelResponseParts.length > 0) {
    history.push({
      role: "model" as const,
      parts: modelResponseParts,
    });
  }

  // Add new prompt as user message
  history.push({
    role: "user" as const,
    parts: [{ type: "text" as const, text: newPrompt }],
  });

  return history;
}

/**
 * Get the appropriate engine for the provider
 */
function getEngine(provider: "openai" | "gemini"): ImageEngine {
  return provider === "openai" ? openaiImageEngine : geminiImageEngine;
}

/**
 * Get the default model for a provider
 */
function getDefaultModel(provider: "openai" | "gemini"): string {
  return provider === "openai"
    ? "gpt-5-mini"
    : "gemini-2.5-flash-image-preview";
}

/**
 * Generate image using the orchestrator
 */
export async function generateImage(opts: {
  conversationId: string;
  provider: "openai" | "gemini";
  model?: string;
  prompt_parts: Part[];
  onProgress?: ProgressCallback;
}): Promise<{ jobId: string; images: ImageArtifact[]; provider_meta: any }> {
  const { conversationId, provider, prompt_parts, onProgress } = opts;
  const model = opts.model || getDefaultModel(provider);

  onProgress?.("initializing", 0, "Starting image generation...");

  // Generate request hash for idempotency (simplified without gen_config)
  const request_hash = generateRequestHash(prompt_parts, {});

  // Check for duplicate (optional optimization)
  const existingJob = await store.findDuplicateByHash(
    conversationId,
    request_hash,
  );
  if (existingJob && existingJob.status === "succeeded") {
    onProgress?.("complete", 100, "Using cached result");
    return {
      jobId: "cached", // In a real implementation, you'd return the actual job ID
      images: existingJob.output_summary?.images || [],
      provider_meta: existingJob.provider_meta || {},
    };
  }

  // Create new job
  const jobId = await store.createJob(conversationId, {
    provider,
    model,
    status: "pending",
    input_snapshot: { prompt_parts, gen_config: {} }, // Empty config since it's in config file
    request_hash,
    // Don't include parent_job_id for original jobs (undefined values cause Firestore errors)
    regeneration_index: 0, // Original generation
    conversation_history: [{ role: "user" as const, parts: prompt_parts }], // Store initial conversation
  });

  onProgress?.("generating", 20, "Calling image generation API...");

  try {
    const engine = getEngine(provider);
    const result = await engine.generate({
      model,
      prompt_parts,
    });

    onProgress?.("processing", 70, "Processing generated images...");

    // Save images to storage
    const artifacts: ImageArtifact[] = [];
    for (let i = 0; i < result.images.length; i++) {
      const img = result.images[i];
      const ext = getExtensionFromMime(img.mimeType);
      const storagePath = `books/${conversationId}/generated_images/${jobId}_${i}.${ext}`;

      const saved = await saveBufferToStorage(img.buffer, ext, storagePath);
      const artifact: ImageArtifact = {
        ...saved,
        mimeType: img.mimeType,
        bytes: img.buffer.length,
      };

      artifacts.push(artifact);
      await store.appendArtifact(conversationId, jobId, {
        type: "image",
        ...artifact,
      });
    }

    // Update job status
    const outputSummary: any = {
      images: artifacts,
    };

    // Only include text if it's actually provided
    if (result.text) {
      outputSummary.text = result.text;
    }

    // Update conversation history with model response (both text AND images) for future regenerations
    const modelResponseParts: Part[] = [
      ...(result.text ? [{ type: "text" as const, text: result.text }] : []),
      ...artifacts.map((img) => ({
        type: "image_url" as const,
        url: img.url,
        mimeType: img.mimeType,
      })),
    ];

    const updatedConversationHistory: ConversationTurn[] = [
      { role: "user" as const, parts: prompt_parts },
      { role: "model" as const, parts: modelResponseParts },
    ];

    await store.markJobStatus(conversationId, jobId, "succeeded", {
      output_summary: outputSummary,
      provider_meta: result.provider_meta,
    });

    // Update conversation history (always, since we now include generated images)
    await store.updateJobConversationHistory(
      conversationId,
      jobId,
      updatedConversationHistory,
    );

    onProgress?.("complete", 100, "Image generation complete");

    return {
      jobId,
      images: artifacts,
      provider_meta: result.provider_meta,
    };
  } catch (error) {
    console.error(`Image generation error for job ${jobId}:`, error);

    await store.markJobStatus(conversationId, jobId, "failed");

    throw error;
  }
}

/**
 * Regenerate image using the orchestrator with proper job chaining
 */
export async function regenerateImage(opts: {
  conversationId: string;
  jobId: string;
  revisedPrompt?: string;
  onProgress?: ProgressCallback;
}): Promise<{ jobId: string; images: ImageArtifact[]; provider_meta: any }> {
  const { conversationId, jobId, revisedPrompt, onProgress } = opts;

  onProgress?.("initializing", 0, "Loading job for regeneration...");

  // Load the original/parent job
  const parentJob = await store.loadJob(conversationId, jobId);
  if (!parentJob) {
    throw new Error(`Job ${jobId} not found`);
  }

  const { provider, model } = parentJob;
  const engine = getEngine(provider);

  // Generate child job ID
  const parentJobId = getParentJobId(jobId);
  const currentIndex = getRegenerationIndex(jobId);
  const newIndex = currentIndex + 1;
  const newJobId = generateChildJobId(parentJobId, newIndex);

  onProgress?.("building_history", 10, "Building conversation history...");

  // Build conversation history for multi-turn
  const conversationHistory = await buildConversationHistory(
    conversationId,
    jobId,
    revisedPrompt || "Regenerate this image",
  );

  // Create new job with chaining information
  const request_hash = generateRequestHash(
    conversationHistory.slice(-1)[0].parts,
    {},
  );

  const childJobId = await store.createJob(conversationId, {
    provider,
    model,
    status: "pending",
    input_snapshot: {
      prompt_parts: conversationHistory.slice(-1)[0].parts, // Latest user input
      gen_config: parentJob.input_snapshot.gen_config,
    },
    request_hash,
    parent_job_id: jobId,
    regeneration_index: newIndex,
    conversation_history: conversationHistory,
  });

  onProgress?.("regenerating", 30, "Regenerating image...");

  let result;

  // Try native OpenAI regeneration first if available
  if (
    provider === "openai" &&
    engine.regenerate &&
    parentJob.provider_meta?.raw_refs?.response_id
  ) {
    try {
      result = await engine.regenerate({
        response_id: parentJob.provider_meta.raw_refs.response_id,
      });
      onProgress?.("processing", 70, "Processing regenerated images...");
    } catch (error) {
      console.warn(
        "Native OpenAI regeneration failed, falling back to conversation history:",
        error,
      );
      result = null;
    }
  }

  // Use conversation history for Gemini or OpenAI fallback
  if (!result) {
    if (provider === "gemini") {
      // For Gemini, use the conversation history to create a multi-turn chat
      result = await engine.generate({
        model,
        prompt_parts: conversationHistory.slice(-1)[0].parts, // Send latest user input
        conversation_history: conversationHistory.slice(0, -1), // Send prior history
      });
    } else {
      // For OpenAI fallback, send just the latest prompt with image references
      result = await engine.generate({
        model,
        prompt_parts: conversationHistory.slice(-1)[0].parts,
      });
    }
    onProgress?.("processing", 70, "Processing regenerated images...");
  }

  // Save artifacts
  const artifacts: ImageArtifact[] = [];
  for (let i = 0; i < result.images.length; i++) {
    const img = result.images[i];
    const ext = getExtensionFromMime(img.mimeType);
    const storagePath = `books/${conversationId}/images/${childJobId}_${i}.${ext}`;

    const saved = await saveBufferToStorage(img.buffer, ext, storagePath);
    const artifact: ImageArtifact = {
      ...saved,
      mimeType: img.mimeType,
      bytes: img.buffer.length,
    };

    artifacts.push(artifact);
  }

  // Update job status
  const outputSummary: any = {
    images: artifacts,
  };

  if (result.text) {
    outputSummary.text = result.text;
  }

  await store.markJobStatus(conversationId, childJobId, "succeeded", {
    output_summary: outputSummary,
    provider_meta: result.provider_meta,
  });

  onProgress?.("complete", 100, "Regeneration complete");

  return {
    jobId: childJobId,
    images: artifacts,
    provider_meta: result.provider_meta,
  };
}
