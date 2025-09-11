import { storage } from "../../../../storage";
import {
  ImageJob,
  ImageArtifact,
  JobStatus,
  ProviderMeta,
  ConversationTurn,
} from "./types";

/**
 * Generate a unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new image generation job
 * For now, we'll store this as part of the book data since that's what the current storage supports
 */
export async function createJob(
  conversationId: string,
  payload: Omit<ImageJob, "createdAt" | "updatedAt">,
): Promise<string> {
  const jobId = generateJobId();
  const now = new Date();

  const job: ImageJob = {
    ...payload,
    createdAt: now,
    updatedAt: now,
  };

  // Use read-modify-write to ensure proper nested structure for imageJobs
  await storage.updateBookFields(conversationId, {
    imageJobs: {
      [jobId]: job,
    },
  });

  return jobId;
}

/**
 * Update job status and metadata
 */
export async function markJobStatus(
  conversationId: string,
  jobId: string,
  status: JobStatus,
  updates: Partial<Pick<ImageJob, "output_summary" | "provider_meta">> = {},
): Promise<void> {
  // Build the job update object with proper nested structure
  const now = new Date();
  const jobUpdate: Partial<ImageJob> = {
    status,
    updatedAt: now,
    ...updates,
  };

  // Use nested structure instead of dot notation
  await storage.updateBookFields(conversationId, {
    imageJobs: {
      [jobId]: jobUpdate,
    },
  });
}

/**
 * Add an artifact to a job
 */
export async function appendArtifact(
  conversationId: string,
  jobId: string,
  artifact: ImageArtifact & { type: "image" },
): Promise<string> {
  const artifactId = `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Get current job to preserve existing artifacts
  const currentJob = await loadJob(conversationId, jobId);
  if (!currentJob) {
    throw new Error(`Job ${jobId} not found when trying to append artifact`);
  }

  const artifactData = { ...artifact, createdAt: new Date() };
  const currentArtifacts = currentJob.artifacts || {};

  // Use nested structure to update artifacts
  await storage.updateBookFields(conversationId, {
    imageJobs: {
      [jobId]: {
        ...currentJob,
        artifacts: {
          ...currentArtifacts,
          [artifactId]: artifactData,
        },
      },
    },
  });

  return artifactId;
}

/**
 * Load a job by ID
 */
export async function loadJob(
  conversationId: string,
  jobId: string,
): Promise<ImageJob | null> {
  // Use getBookById to match what the regenerateImage route uses
  const book = await storage.getBookById(conversationId);
  console.log(
    `[DEBUG] loadJob: Looking for jobId=${jobId} in conversationId=${conversationId}`,
  );
  console.log(`[DEBUG] loadJob: book exists? ${!!book}`);
  console.log(
    `[DEBUG] loadJob: book.imageJobs exists? ${!!(book as any)?.imageJobs}`,
  );
  console.log(
    `[DEBUG] loadJob: book.imageJobs keys: ${book && (book as any).imageJobs ? Object.keys((book as any).imageJobs).join(",") : "none"}`,
  );
  console.log(
    `[DEBUG] loadJob: direct job lookup is null? ${(book as any)?.imageJobs?.[jobId] ? "no" : "yes"}`,
  );

  return (book as any)?.imageJobs?.[jobId] || null;
}

/**
 * Find duplicate job by request hash (for idempotency)
 */
export async function findDuplicateByHash(
  conversationId: string,
  requestHash: string,
): Promise<ImageJob | null> {
  // Note: This would require a Firestore query by request_hash
  // For now, we'll skip this optimization and just create new jobs
  // In a full implementation, you'd query the imageJobs collection
  // where request_hash === requestHash and status === "succeeded"
  return null;
}

/**
 * Get job artifacts
 */
export async function getJobArtifacts(
  conversationId: string,
  jobId: string,
): Promise<(ImageArtifact & { id: string })[]> {
  const book = await storage.getBookById(conversationId);
  const job = (book as any)?.imageJobs?.[jobId];

  if (!job || !job.artifacts) {
    return [];
  }

  return Object.entries(job.artifacts).map(([id, artifact]) => ({
    id,
    ...(artifact as any),
  })) as (ImageArtifact & { id: string })[];
}

/**
 * Update conversation history for a job
 */
export async function updateJobConversationHistory(
  conversationId: string,
  jobId: string,
  conversationHistory: ConversationTurn[],
): Promise<void> {
  // Get current job to preserve other fields
  const currentJob = await loadJob(conversationId, jobId);
  if (!currentJob) {
    throw new Error(
      `Job ${jobId} not found when trying to update conversation history`,
    );
  }

  // Use nested structure to update conversation history
  await storage.updateBookFields(conversationId, {
    imageJobs: {
      [jobId]: {
        ...currentJob,
        conversation_history: conversationHistory,
        updatedAt: new Date(),
      },
    },
  });
}
