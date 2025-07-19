import { JobStatus, JobTracker } from "../types";

class JobTrackerService implements JobTracker {
  private jobs: Map<string, JobStatus> = new Map();

  newJob(): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.jobs.set(jobId, {
      phase: "initialized",
      pct: 0,
    });
    return jobId;
  }

  set(jobId: string, status: Partial<JobStatus>): void {
    const existing = this.jobs.get(jobId) || { phase: "unknown", pct: 0 };
    this.jobs.set(jobId, { ...existing, ...status });
  }

  get(jobId: string): JobStatus | undefined {
    return this.jobs.get(jobId);
  }

  // Clean up old jobs (optional - you can call this periodically)
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [jobId, status] of this.jobs.entries()) {
      const jobTimestamp = parseInt(jobId.split("_")[1]);
      if (now - jobTimestamp > maxAge) {
        this.jobs.delete(jobId);
      }
    }
  }
}

export const jobTracker = new JobTrackerService();
