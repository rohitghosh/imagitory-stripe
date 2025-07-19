import { v4 as uuid } from "uuid";

export const phases = [
  "uploading",
  "training",
  "prompting",
  "generating",
  "saving",
  "complete",
  "error",
] as const;

/** Loose type for now, but IntelliSense still helps. */
export type JobPhase = (typeof phases)[number] | (string & {});

/**
 * We’ve added optional slots for whatever payload
 * each phase might attach: avatar info, skeleton data,
 * full page list, covers, etc.
 */


export interface JobState<P = Record<string, unknown>> {
  phase: JobPhase;
  pct: number;
  message?: string;
  error?: string;
  payload?: P;       // <— one escape hatch
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
