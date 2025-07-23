import { useEffect, useState, useRef } from "react";
import { EventSourcePolyfill } from "event-source-polyfill"; // if you need CORS POST


/* inside the for-await loop */


export function useValidationStream(
  start: boolean,
  payload: Record<string, unknown> | null
) {
  const [reasoning, setReasoning] = useState("");
  const [result,    setResult]    = useState<any>(null);
  const [done,      setDone]      = useState(false);
  const abortRef    = useRef<AbortController>();

  useEffect(() => {
    if (!start || !payload) return;

    const ac = new AbortController();
    abortRef.current = ac;

    const es = new EventSourcePolyfill("/api/runValidation", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      signal:  ac.signal
    });

    es.onmessage = (e) => {                    // default “message” = reasoning
      setReasoning((prev) => prev + e.data);
    };

    es.addEventListener("result", (e: any) => {
      setResult(JSON.parse(e.data));
      setDone(true);
      es.close();
    });

    es.onerror = () => { es.close(); };

    return () => { ac.abort(); es.close(); };
  }, [start, payload]);

  return { reasoning, result, done, cancel: () => abortRef.current?.abort() };
}
