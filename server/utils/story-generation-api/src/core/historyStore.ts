import { storage } from "../../../../storage";
import { ImageJob, ImageArtifact, JobStatus, ProviderMeta } from "./types";

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

  // Atomic nested-field write to avoid read-modify-write races
  await storage.updateBookFields(conversationId, {
    [`imageJobs.${jobId}`]: job,
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
  // Atomic upsert of job status and optional fields
  const now = new Date();
  const updatePayload: Record<string, any> = {
    [`imageJobs.${jobId}.status`]: status,
    [`imageJobs.${jobId}.updatedAt`]: now,
  };
  if (updates.output_summary) {
    if (updates.output_summary.images) {
      updatePayload[`imageJobs.${jobId}.output_summary.images`] =
        updates.output_summary.images;
    }
    if (typeof updates.output_summary.text !== "undefined") {
      // Only set when provided to avoid undefined writes; if empty string allowed, it will set
      updatePayload[`imageJobs.${jobId}.output_summary.text`] =
        updates.output_summary.text;
    }
  }
  if (updates.provider_meta) {
    updatePayload[`imageJobs.${jobId}.provider_meta`] = updates.provider_meta;
  }
  await storage.updateBookFields(conversationId, updatePayload);
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

  // Append artifact atomically without reading the whole object
  const artifactData = { ...artifact, createdAt: new Date() };
  await storage.updateBookFields(conversationId, {
    // Initialize artifacts map for this job if missing, then set child
    // Firestore update will create the nested path if imageJobs/jobId exists.
    [`imageJobs.${jobId}.artifacts.${artifactId}`]: artifactData,
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
  const book = await storage.getBook(conversationId);
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
  const book = await storage.getBook(conversationId);
  const job = (book as any)?.imageJobs?.[jobId];

  if (!job || !job.artifacts) {
    return [];
  }

  return Object.entries(job.artifacts).map(([id, artifact]) => ({
    id,
    ...(artifact as any),
  })) as (ImageArtifact & { id: string })[];
}
