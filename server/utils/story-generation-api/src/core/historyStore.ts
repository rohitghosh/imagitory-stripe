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
  payload: Omit<ImageJob, 'createdAt' | 'updatedAt'>
): Promise<string> {
  const jobId = generateJobId();
  const now = new Date();
  
  const job: ImageJob = {
    ...payload,
    createdAt: now,
    updatedAt: now
  };
  
  // For now, we'll store the job in the book's imageJobs field
  // In a full implementation, you'd create a separate imageJobs collection
  const existingBook = await storage.getBook(conversationId);
  const imageJobs = existingBook?.imageJobs || {};
  imageJobs[jobId] = job;
  
  await storage.updateBook(conversationId, { imageJobs });
  
  return jobId;
}

/**
 * Update job status and metadata
 */
export async function markJobStatus(
  conversationId: string,
  jobId: string,
  status: JobStatus,
  updates: Partial<Pick<ImageJob, 'output_summary' | 'provider_meta'>> = {}
): Promise<void> {
  const book = await storage.getBook(conversationId);
  if (!book || !book.imageJobs?.[jobId]) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  const updatedJob = {
    ...book.imageJobs[jobId],
    status,
    updatedAt: new Date(),
    ...updates
  };
  
  const imageJobs = { ...book.imageJobs };
  imageJobs[jobId] = updatedJob;
  
  await storage.updateBook(conversationId, { imageJobs });
}

/**
 * Add an artifact to a job
 */
export async function appendArtifact(
  conversationId: string,
  jobId: string,
  artifact: ImageArtifact & { type: "image" }
): Promise<string> {
  const artifactId = `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const book = await storage.getBook(conversationId);
  if (!book || !book.imageJobs?.[jobId]) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  const artifactData = {
    ...artifact,
    createdAt: new Date()
  };
  
  // Store artifacts in the job data
  const imageJobs = { ...book.imageJobs };
  const job = { ...imageJobs[jobId] };
  job.artifacts = job.artifacts || {};
  job.artifacts[artifactId] = artifactData;
  imageJobs[jobId] = job;
  
  await storage.updateBook(conversationId, { imageJobs });
  
  return artifactId;
}

/**
 * Load a job by ID
 */
export async function loadJob(
  conversationId: string,
  jobId: string
): Promise<ImageJob | null> {
  const book = await storage.getBook(conversationId);
  return book?.imageJobs?.[jobId] || null;
}

/**
 * Find duplicate job by request hash (for idempotency)
 */
export async function findDuplicateByHash(
  conversationId: string,
  requestHash: string
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
  jobId: string
): Promise<(ImageArtifact & { id: string })[]> {
  const book = await storage.getBook(conversationId);
  const job = book?.imageJobs?.[jobId];
  
  if (!job || !job.artifacts) {
    return [];
  }
  
  return Object.entries(job.artifacts).map(([id, artifact]) => ({
    id,
    ...artifact
  })) as (ImageArtifact & { id: string })[];
}
