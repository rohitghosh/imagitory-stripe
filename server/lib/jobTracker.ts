// server/lib/jobTracker.ts
import { v4 as uuid } from "uuid";

export type JobPhase =
  | "training"
  | "prompting"
  | "generating"
  | "saving"
  | "complete"
  | "error";

export interface JobState {
  phase: JobPhase;
  pct: number; // 0-100
  message?: string;
  modelId?: string;
  error?: string;
}

const m = new Map<string, JobState>();
export const jobTracker = {
  newJob(): string {
    const id = uuid();
    m.set(id, { phase: "training", pct: 0 });
    return id;
  },
  get: (id: string) => m.get(id),
  set: (id: string, patch: Partial<JobState>) =>
    m.set(id, { ...(m.get(id) ?? { phase: "training", pct: 0 }), ...patch }),
};
