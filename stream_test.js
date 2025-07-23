import OpenAI from "openai";

const openai = new OpenAI();

/* --- 1. Minimal prompts ------------------------------------------ /* 1 ▸ A problem that really needs reasoning */
const messages = [
  { role: "system",
    content: "You are a meticulous analyst. Think step-by-step, " +
             "but show only a short summary of your reasoning to the user." },
  { role: "user",
    content: [
      "Here are three claims:\n",
      "A) All metals conduct electricity.\n",
      "B) Bismuth is a metal.\n",
      "C) Bismuth is a good electrical conductor.\n\n",
      "Is the conclusion (C) logically valid given (A) and (B)? ",
      "Answer Yes/No, cite a source, give a confidence score 0-1, ",
      "and output the JSON object {answer, source, confidence}."
    ].join("")
  }
];

/* 2 ▸ JSON schema the assistant must satisfy */
const schema = {
  type: "object",
  properties: {
    answer:     { type: "string", enum: ["Yes", "No"] },
    source:     { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  },
  required: ["answer", "source", "confidence"],
  additionalProperties: false
};

/* 3 ▸ Fire the request (switch to o3 if you have access) */
const stream = await openai.responses.create({
  model:  "o4-mini",                  // <-- supports reasoning summaries
  stream: true,

  input:  messages,

  text:   { format: { type: "json_schema",
                      name: "logic_check",
                      schema, strict: true } },

  reasoning: { summary: "detailed" }  // ask for a delta-streamed summary
});

/* 4 ▸ Route deltas */
let summaryBuf = "";
let jsonBuf    = "";
let summaryDone = false;

for await (const ev of stream) {
  switch (ev.type) {

    case "response.reasoning_summary_text.delta":
      process.stdout.write(ev.delta);       // live CoT summary
      summaryBuf += ev.delta;
      break;

    case "response.reasoning_summary_text.done":
      summaryDone = true;
      console.log("\n\n--- assistant answer incoming ---\n");
      break;

    case "response.output_text.delta":
      if (summaryDone) jsonBuf += ev.delta; // accumulate JSON only after summary
      break;
  }
}

/* 5 ▸ Final structured answer */
console.log("--- Parsed JSON object ---");
try {
  console.dir(JSON.parse(jsonBuf), { depth: null });
} catch (e) {
  console.error("Couldn’t parse JSON:", e);
}

if (!summaryBuf)
  console.warn("\n(⚠  No reasoning summary was returned for this request.)");