import { useState, useEffect } from "react";

// util hook placed above component definition
export function useJobProgress(jobId?: string) {
  const [state, setState] = useState<{
    pct: number;
    phase: string;
    message?: string;
    error?: string;
  }>();

  useEffect(() => {
    if (!jobId) return;
    let cancel = false;

    const poll = async () => {
      const r = await fetch(`/api/jobs/${jobId}/progress`, {
        credentials: "include",
      });
      const j = await r.json();
      if (!cancel) {
        setState(j);
        if (j.phase !== "complete" && j.phase !== "error")
          setTimeout(poll, 3000);
      }
    };
    poll();

    return () => {
      cancel = true;
    };
  }, [jobId]);

  return state;
}
