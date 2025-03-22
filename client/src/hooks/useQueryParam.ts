import { useState, useEffect } from "react";

function useQueryParam(key: string): string | null {
  const getQueryValue = () =>
    new URLSearchParams(window.location.search).get(key);
  const [value, setValue] = useState(getQueryValue);

  useEffect(() => {
    const update = () => {
      const newVal = getQueryValue();
      setValue((prev) => (prev !== newVal ? newVal : prev));
    };

    // Monkey-patch history methods to dispatch a new event
    const patchHistoryMethod = (type: "pushState" | "replaceState") => {
      const original = history[type];
      return function (...args: any[]) {
        const result = original.apply(this, args);
        window.dispatchEvent(new Event("locationchange"));
        return result;
      };
    };

    history.pushState = patchHistoryMethod("pushState");
    history.replaceState = patchHistoryMethod("replaceState");

    window.addEventListener("popstate", update);
    window.addEventListener("locationchange", update);

    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("locationchange", update);
    };
  }, [key]);

  return value;
}

export { useQueryParam };
