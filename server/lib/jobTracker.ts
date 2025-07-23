import { v4 as uuid } from "uuid";
import EventEmitter from "events";

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
  log?    : string; 
  error?: string;
  payload?: P;       // <— one escape hatch
}

const m = new Map<string, JobState>();

class JobTracker extends EventEmitter {
  private store = new Map<string, JobState>();

  /** Create new job in “uploading” phase */
  newJob(): string {
    const id = uuid();
    this.store.set(id, { phase: "uploading", pct: 0 });
    return id;
  }

  /** Read current state */
  get(id: string): JobState | undefined {
    return this.store.get(id);
  }

  /** Patch state + emit update */
  set(id: string, patch: Partial<JobState>): void {
    const prev  = this.store.get(id) ?? { phase: "uploading", pct: 0 };
    const next  = { ...prev, ...patch };
    this.store.set(id, next);

    /* 🔴 broadcast */
    this.emit("update", id, next);
  }
}

/* ------------------------------------------------------------------ */
/* 3 ▸ Export singleton – old import paths keep working               */
/* ------------------------------------------------------------------ */
export const jobTracker = new JobTracker();