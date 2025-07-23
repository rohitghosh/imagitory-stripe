import fetch from "node-fetch";

/**  Ⓐ  Shape of what the overlay-service gives us back */
interface RawOverlayResponse {
  success: boolean;
  color: string;
  confidence: number;
  startX: number;
  startY: number;
  textFlow: string[];
  image_dimensions: { width: number; height: number };
}

// /**  Ⓑ  Normalised object we’ll pass to the rest of the code-base */
export interface OverlayHint {
  startX: number;
  startY: number;
  side: "left" | "right";
  color: string;
  lines: string[];
  imageWidth: number;
  imageHeight: number;
  fontSize: number;
  fontFamily: string;
}

/**
 * Call the /overlay-text endpoint and convert its reply into a strongly-typed
 * object ready for `prepareSplit` (or whatever replaces it later).
 */
// export async function getOverlayHint(
//   imageUrl: string,
//   inputText: string | string[],          // full stanza or array of lines
//   {
//     retainFlow = Array.isArray(inputText),
//     fontSize = 24,
//     fontFamily = "Nunito SemiBold Italic",
//     debugMode = false,
//   }: {
//     retainFlow?: boolean;
//     fontSize?: number;
//     fontFamily?: string;
//     debugMode?: boolean;
//   } = {},
// ): Promise<OverlayHint> {
//   const endpoint =
//     process.env.TEXT_OVERLAY_ENDPOINT ??
//     "https://text-overlay.replit.app/overlay-text";

//   const payload = {
//     image_url: imageUrl,
//     input_text: inputText,
//     retainFlow,
//     font_size: fontSize,
//     font_family: fontFamily,
//     debug_mode: debugMode,
//   };

//   const res = await fetch(endpoint, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     /** ⚠️ If the service later needs a key, add
//      *      "Authorization": `Bearer ${process.env.TEXT_OVERLAY_KEY}`
//      */
//     body: JSON.stringify(payload),
//   });

//   if (!res.ok) {
//     throw new Error(
//       `overlay-text API ${res.status}: ${res.statusText} – ${await res.text()}`,
//     );
//   }

//   const data: RawOverlayResponse = await res.json();
//   if (!data.success) throw new Error("overlay-text API returned success=false");

//   const { width, height } = data.image_dimensions;
//   const side: "left" | "right" = data.startX > width / 2 ? "right" : "left";

//   return {
//     startX: data.startX,
//     startY: data.startY,
//     side,
//     color: data.color,
//     lines: data.textFlow,
//     imageWidth: width,
//     imageHeight: height,
//     fontSize,
//     fontFamily,
//   };
// }

export async function getOverlayHint(
  imageUrl: string,
  inputText: string[], // always an array now
  side: "left" | "right", // positioning from storage
  isRhyming: boolean, // whether story is rhyming
  {
    fontSize = 24,
    fontFamily = "Nunito SemiBold Italic",
    debugMode = false,
  }: {
    fontSize?: number;
    fontFamily?: string;
    debugMode?: boolean;
  } = {},
): Promise<OverlayHint> {
  const endpoint =
    process.env.TEXT_OVERLAY_ENDPOINT ??
    "https://text-overlay.replit.app/overlay-text";

  console.log(
    `[${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}] overlay-text API payload:\n` +
      `  image_url: ${imageUrl}\n` +
      `  input_text: ${inputText}\n` +
      `  font_size: ${fontSize}\n` +
      `  font_family: ${fontFamily}\n` +
      `  debug_mode: ${debugMode}\n` +
      `  side: ${side}`,
  );

  // helper to call overlay API
  async function callAPI(retainFlow: boolean) {
    const payload = {
      image_url: imageUrl,
      input_text: inputText,
      retainFlow,
      font_size: fontSize,
      font_family: fontFamily,
      debug_mode: debugMode,
      positioning: side, // pass positioning
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const bodyText = await res.text();
    let data: any;
    try {
      data = JSON.parse(bodyText);
    } catch {
      throw new Error(
        `overlay-text API ${res.status}: ${res.statusText} – ${bodyText}`,
      );
    }
    console.log(`overlay-text API response: ${payload}`);
    if (!res.ok || !data.success) {
      // on 500 + "No valid candidates found" + non-rhyming, retry with retainFlow=false
      if (
        res.status === 500 &&
        data.error === "No valid candidates found" &&
        !isRhyming
      ) {
        console.log("Retrying with retainFlow=false");
        return callAPI(false);
      }
      throw new Error(
        `overlay-text API ${res.status}: ${res.statusText} – ${data.error || bodyText}`,
      );
    }

    return data;
  }

  // first attempt always with retainFlow=true
  const raw = await callAPI(true);
  const { startX, startY, color, textFlow, image_dimensions } = raw;
  const { width, height } = image_dimensions;

  return {
    startX,
    startY,
    side, // preserve passed-in side
    color,
    lines: textFlow,
    imageWidth: width,
    imageHeight: height,
    fontSize,
    fontFamily,
  };
}
