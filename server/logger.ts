// logger.ts
import pino from "pino";
import { Logtail } from "@logtail/node";

const prod = process.env.NODE_ENV === "production";
const repl = !!process.env.REPL_ID; // Replit sets this
const pretty = !!process.env.PRETTY_LOGS;

const transports: pino.TransportMultiOptions = {
  targets: [],
};

if (prod && process.env.LOGTAIL_TOKEN) {
  transports.targets.push({
    target: "@logtail/pino",
    options: {
      sourceToken: process.env.LOGTAIL_TOKEN,
      options: { endpoint: process.env.LOGTAIL_ENDPOINT },
    },
    level: process.env.LOG_LEVEL || "info",
  });
}

if (!prod || repl || pretty) {
  transports.targets.push({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss.l", // e.g. 12:34:56.789
      ignore: "pid,hostname",
      singleLine: false, // drop boilerplate
    },
    level: process.env.LOG_LEVEL || (!prod ? "debug" : "info"),
  });
}

const log = pino({
  base: undefined, // remove pid/hostname keys
  timestamp: pino.stdTimeFunctions.isoTime,
  level: process.env.LOG_LEVEL || (prod ? "info" : "debug"),
  transport: transports,
});

// ───── ONE-TIME CONSOLE SHIM ─────────────────────────
["log", "info", "warn", "error", "debug"].forEach((method) => {
  const level = method === "log" ? "info" : method;

  // @ts-ignore intentional patch
  console[method] = (...args: any[]) => {
    const idx = args.findIndex((a) => a instanceof Error);
    if (idx > -1) {
      // pull the Error out so Pino prints its stack
      const [err] = args.splice(idx, 1);
      (log as any)[level](err, ...args);
    } else {
      (log as any)[level](...args);
    }
  };
});

export default log;
