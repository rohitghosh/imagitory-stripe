import { createHash } from "crypto";
import { Part, ImageGenConfig } from "./types";

/**
 * Stable JSON stringify with sorted keys for deterministic hashing
 */
function stableStringify(obj: any): string {
  if (obj === null || obj === undefined) {
    return String(obj);
  }
  
  if (typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    return `[${obj.map(stableStringify).join(",")}]`;
  }
  
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => `${JSON.stringify(key)}:${stableStringify(obj[key])}`);
  return `{${pairs.join(",")}}`;
}

/**
 * Generate a stable hash for request deduplication
 */
export function generateRequestHash(
  prompt_parts: Part[], 
  gen_config?: ImageGenConfig
): string {
  const input = {
    prompt_parts,
    gen_config: gen_config || {}
  };
  
  const stableJson = stableStringify(input);
  return createHash('sha256').update(stableJson).digest('hex');
}
