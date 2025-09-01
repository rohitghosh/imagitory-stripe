import { openaiImageEngine } from "../engines/openaiImageEngine";
import { geminiImageEngine } from "../engines/geminiImageEngine";
import { 
  Part, 
  ImageGenConfig, 
  ImageEngine, 
  ImageArtifact,
  GenerationResult,
  ProgressCallback
} from "./types";
import * as store from "./historyStore";
import { saveBufferToStorage, getExtensionFromMime } from "./storage";
import { generateRequestHash } from "./hashing";

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
  return provider === "openai" ? "gpt-4o-mini" : "gemini-2.5-flash-image-preview";
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
  const existingJob = await store.findDuplicateByHash(conversationId, request_hash);
  if (existingJob && existingJob.status === "succeeded") {
    onProgress?.("complete", 100, "Using cached result");
    return {
      jobId: "cached", // In a real implementation, you'd return the actual job ID
      images: existingJob.output_summary?.images || [],
      provider_meta: existingJob.provider_meta || {}
    };
  }
  
  // Create new job
  const jobId = await store.createJob(conversationId, {
    provider,
    model,
    status: "pending",
    input_snapshot: { prompt_parts, gen_config: {} }, // Empty config since it's in config file
    request_hash
  });
  
  onProgress?.("generating", 20, "Calling image generation API...");
  
  try {
    const engine = getEngine(provider);
    const result = await engine.generate({
      model,
      prompt_parts
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
        bytes: img.buffer.length
      };
      
      artifacts.push(artifact);
      await store.appendArtifact(conversationId, jobId, {
        type: "image",
        ...artifact
      });
    }
    
    // Update job status
    await store.markJobStatus(conversationId, jobId, "succeeded", {
      output_summary: {
        images: artifacts,
        text: result.text
      },
      provider_meta: result.provider_meta
    });
    
    onProgress?.("complete", 100, "Image generation complete");
    
    return {
      jobId,
      images: artifacts,
      provider_meta: result.provider_meta
    };
    
  } catch (error) {
    console.error(`Image generation error for job ${jobId}:`, error);
    
    await store.markJobStatus(conversationId, jobId, "failed");
    
    throw error;
  }
}

/**
 * Regenerate image using the orchestrator
 */
export async function regenerateImage(opts: {
  conversationId: string;
  jobId: string;
  revisedPrompt?: string;
  onProgress?: ProgressCallback;
}): Promise<{ jobId: string; images: ImageArtifact[]; provider_meta: any }> {
  const { conversationId, jobId, revisedPrompt, onProgress } = opts;
  
  onProgress?.("initializing", 0, "Loading job for regeneration...");
  
  // Load the original job
  const job = await store.loadJob(conversationId, jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  const { provider, model, input_snapshot, provider_meta } = job;
  const engine = getEngine(provider);
  
  onProgress?.("regenerating", 20, "Regenerating image...");
  
  // Try native regeneration for OpenAI if response_id is available
  if (provider === "openai" && engine.regenerate && provider_meta?.raw_refs?.response_id) {
    try {
      const result = await engine.regenerate({
        response_id: provider_meta.raw_refs.response_id
      });
      
      onProgress?.("processing", 70, "Processing regenerated images...");
      
      // Save regenerated images
      const artifacts: ImageArtifact[] = [];
      for (let i = 0; i < result.images.length; i++) {
        const img = result.images[i];
        const ext = getExtensionFromMime(img.mimeType);
        const storagePath = `books/${conversationId}/regenerated_images/${jobId}_regen_${Date.now()}_${i}.${ext}`;
        
        const saved = await saveBufferToStorage(img.buffer, ext, storagePath);
        const artifact: ImageArtifact = {
          ...saved,
          mimeType: img.mimeType,
          bytes: img.buffer.length
        };
        
        artifacts.push(artifact);
      }
      
      onProgress?.("complete", 100, "Regeneration complete");
      
      return {
        jobId: `${jobId}_regen_${Date.now()}`,
        images: artifacts,
        provider_meta: result.provider_meta
      };
      
    } catch (error) {
      console.warn("Native regeneration failed, falling back to replay:", error);
    }
  }
  
  // Fallback: replay generation with original or modified prompt
  let prompt_parts = input_snapshot.prompt_parts;
  
  // If revised prompt provided, replace text parts
  if (revisedPrompt) {
    prompt_parts = [
      { type: "text", text: revisedPrompt },
      ...prompt_parts.filter(p => p.type !== "text")
    ];
  }
  
  // Generate new image (config handled by engines from config file)
  return generateImage({
    conversationId,
    provider,
    model,
    prompt_parts,
    onProgress
  });
}
