// import { useState, useEffect } from "react";

// // util hook placed above component definition
// export function useJobProgress(jobId?: string) {
//   const [state, setState] = useState<{
//     pct: number;
//     phase: string;
//     message?: string;
//     error?: string;
//   }>();

//   useEffect(() => {
//     if (!jobId) return;
//     let cancel = false;

//     const poll = async () => {
//       console.log(`[Client] Polling job ${jobId}...`);
//       const r = await fetch(`/api/jobs/${jobId}/progress`, {
//         credentials: "include",
//       });
//       const j = await r.json();
//       console.log(`[Client] Job ${jobId} response:`, j);
//       if (!cancel) {
//         setState(j);
//         if (j.phase !== "complete" && j.phase !== "error")
//           setTimeout(poll, 3000);
//       }
//     };
//     poll();

//     return () => {
//       cancel = true;
//     };
//   }, [jobId]);

//   return state;
// }


import { useState, useEffect, useRef } from "react";

// util hook placed above component definition
export function useJobProgress(jobId?: string) {
  const [state, setState] = useState<{
    pct: number;
    phase: string;
    message?: string;
    error?: string;
    log?: string;
  }>();

  const lastServerPct = useRef<number>(0);
  const currentDisplayPct = useRef<number>(0);
  const phaseStartTime = useRef<number>(Date.now());
  const smoothingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let cancel = false;

    // Clear any existing smoothing interval when jobId changes
    if (smoothingInterval.current) {
      clearInterval(smoothingInterval.current);
      smoothingInterval.current = null;
    }

    const startSmoothing = (targetPct: number, currentPct: number, phase: string) => {
      if (smoothingInterval.current) {
        clearInterval(smoothingInterval.current);
      }

      // Define minimum progress speeds for different phases (% per second)
      const progressSpeeds = {
        initializing: 0.5,   // Slow initialization
        prompting: 0.3,      // Very slow for reasoning phase  
        reasoning: 0.2,      // Very slow for deep thinking
        generating: 0.8,     // Faster for image generation
        complete: 100,       // Instant completion
        error: 100,          // Instant error display
      };

      const speed = progressSpeeds[phase] || 0.5;
      const increment = speed / 10; // Update every 100ms, so divide by 10

      smoothingInterval.current = setInterval(() => {
        if (cancel) return;

        const timeSincePhaseStart = Date.now() - phaseStartTime.current;
        const timeBasedProgress = Math.min(timeSincePhaseStart / 60000 * 10, 10); // 10% over 60 seconds max

        // Combine server progress with time-based progress
        const minProgressForTime = Math.max(
          currentDisplayPct.current + increment,
          currentPct + timeBasedProgress
        );

        const newPct = Math.min(
          Math.max(minProgressForTime, targetPct),
          phase === "complete" ? 100 : Math.min(targetPct + 15, 95) // Never go above 95% unless complete
        );

        if (newPct !== currentDisplayPct.current) {
          currentDisplayPct.current = newPct;
          setState(prev => prev ? { ...prev, pct: newPct } : undefined);
        }

        // Stop if we've reached or exceeded the target
        if (newPct >= targetPct || phase === "complete" || phase === "error") {
          if (smoothingInterval.current) {
            clearInterval(smoothingInterval.current);
            smoothingInterval.current = null;
          }
        }
      }, 100);
    };

    const poll = async () => {
      console.log(`[Client] Polling job ${jobId}...`);
      try {
        const r = await fetch(`/api/jobs/${jobId}/progress`, {
          credentials: "include",
        });
        const j = await r.json();
        console.log(`[Client] Job ${jobId} response:`, j);

        if (!cancel) {
          const serverPct = j.pct ?? 0;

          // Check if phase changed
          if (state?.phase !== j.phase) {
            phaseStartTime.current = Date.now();
            currentDisplayPct.current = serverPct;
          }

          // Update state immediately with server data
          setState(j);

          // Start smooth progress if server progress increased or phase changed
          if (serverPct > lastServerPct.current || state?.phase !== j.phase) {
            lastServerPct.current = serverPct;
            startSmoothing(serverPct, currentDisplayPct.current, j.phase);
          }

          // Continue polling unless complete or error
          if (j.phase !== "complete" && j.phase !== "error") {
            setTimeout(poll, 2000); // Reduced from 3000ms for more responsive updates
          }
        }
      } catch (error) {
        console.error(`[Client] Error polling job ${jobId}:`, error);
        if (!cancel) {
          // Retry after a delay on error
          setTimeout(poll, 5000);
        }
      }
    };

    poll();

    return () => {
      cancel = true;
      if (smoothingInterval.current) {
        clearInterval(smoothingInterval.current);
        smoothingInterval.current = null;
      }
    };
  }, [jobId]);

  return state;
}
