import { v4 as uuid } from "uuid";

export type JobPhase =
  | "uploading"
  | "training"
  | "prompting"
  | "generating"
  | "saving"
  | "complete"
  | "error";

/**
 * We’ve added optional slots for whatever payload
 * each phase might attach: avatar info, skeleton data,
 * full page list, covers, etc.
 */
export interface JobState {
  phase: JobPhase;
  pct: number; // 0–100
  message?: string;
  modelId?: string;
  error?: string;

  // Avatar route
  avatarUrl?: string;
  avatarLora?: number;

  // Skeleton route
  sceneTexts?: string[];
  imagePrompts?: string[];

  // Final batch route
  pages?: Array<{
    imageUrl: string;
    prompt: string;
    content: string;
    loraScale: number;
    controlLoraStrength: number;
  }>;
  coverUrl?: string;
  backCoverUrl?: string;
}

const m = new Map<string, JobState>();

export const jobTracker = {
  /**
   * Create a new job in the “uploading” phase.
   * You can override to “training” or others when you .set()
   */
  newJob(): string {
    const id = uuid();
    m.set(id, { phase: "uploading", pct: 0 });
    return id;
  },

  /** Read the current state of a job */
  get(id: string): JobState | undefined {
    return m.get(id);
  },

  /**
   * Patch a job’s state. Spread the old state, then overwrite.
   * This lets you attach any of the optional payload fields above.
   */
  set(id: string, patch: Partial<JobState>) {
    const prev = m.get(id) ?? { phase: "uploading", pct: 0 };
    m.set(id, { ...prev, ...patch });
  },
};
