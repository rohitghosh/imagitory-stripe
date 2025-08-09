import type { Express, Request, Response, NextFunction } from "express";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_FAMILY,
  FULL_W,
  FULL_H,
} from "./constants";
import express from "express";
import { useLocation } from "wouter";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertCharacterSchema,
  insertStorySchema,
  insertBookSchema,
  insertOrderSchema,
  updateBookSchema,
  shippingFormSchema,
} from "@shared/schema";
import { generatePDF } from "./utils/pdf";
// No longer using authentication middleware
import { authenticate } from "./middleware/auth";
// Import firebase but don't initialize with credentials for now
import session from "express-session";
import multer from "multer";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import {
  trainCustomModel,
  generateStoryImages,
  generateImage,
  buildFullPrompt,
  generateBackCoverImage,
  generateGuidedImage,
  generateAvatarImage,
  generateSceneData,
  generateStoryImagesWithAvatar,
  cartoonifyImage,
  generateStoryPackage,
} from "./utils/trainAndGenerate";
import { generateCompleteStory } from "./utils/story-generation-api/src/services/storyGeneration";
import admin from "./firebaseAdmin";
import createMemoryStore from "memorystore";
import {
  expandImageToLeft,
  expandImageToRight,
  splitImageInHalf,
} from "./utils/elementGeneration";
import { pickContrastingTextColor } from "./utils/textColorUtils";
import { loadBase64Image } from "./utils/layouts";
import { uploadBase64ToFirebase } from "./utils/uploadImage";
import { jobTracker } from "./lib/jobTracker";

import { validateStoryInputs } from "./utils/story-generation-api/src/routes/validation";
import { validateCharacterArrays } from "./utils/story-generation-api/src/utils/helpers";
import {
  regenerateScene,
  regenerateBaseCover,
  regenerateFinalCover,
  regenerateFullCover,
} from "./utils/story-generation-api/src/routes/regeneration";
import { OverlayHint, getOverlayHint } from "./utils/overlayText";

import {
  regenerateSceneImage,
  regenerateCoverImage,
  regenerateBaseCoverImage,
  generateFinalCoverWithTitle,
} from "./utils/story-generation-api/src/services/imageGeneration";

type StoryResult = {
  pages: string[];
  coverUrl: string;
  backCoverUrl: string;
  avatarUrl: string;
  avatarLora: number;
};
type StoryJob =
  | { status: "pending" }
  | { status: "complete"; result: StoryResult }
  | { status: "error"; error: string };

const storyJobs = new Map<string, StoryJob>();

const MemoryStore = createMemoryStore(session);

const DEBUG_LOGGING = process.env.DEBUG_LOGGING === "true";

const DEFAULT_FONT_ENLARGED_SIZE = 38;
const DEFAULT_FONT_FAMILY = "Cormorant Garamond Bold";
const DEFAULT_COLOR = "#ffffff";
const FULL_W = 2048;
const FULL_H = 1024;
const HALF_W = FULL_W / 2; // 789
const LOGICAL_W = 600;
const LOGICAL_H = Math.round((FULL_H * LOGICAL_W) / HALF_W);

function time() {
  return new Date().toISOString().slice(11, 23);
}

function mapHint(h: OverlayHint) {
  const localX = h.side === "left" ? h.startX : h.startX - HALF_W;
  const sx = LOGICAL_W / HALF_W;
  const sy = LOGICAL_H / FULL_H;
  const s = Math.min(sx, sy); // one scale for everything

  return {
    x: localX * s,
    y: h.startY * s,
    fontSize: h.fontSize * s,
  };
}

// Extend Express Session type to include userId
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Helper to safely get current values from arrays
function getCurrentFromArray<T>(
  arr: T[] | T | undefined,
  index: number,
): T | undefined {
  if (Array.isArray(arr)) {
    return arr[Math.min(index, arr.length - 1)];
  }
  return arr;
}

// Helper to ensure array format
function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value === undefined) return [];
  return [value];
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  app.use(express.json({ limit: "5mb" }));

  // Configure session middleware with memory store for persistence
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: true,
      saveUninitialized: true,
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
        ttl: 30 * 24 * 60 * 60 * 1000, // 30 days (same as cookie maxAge)
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production", // True in production, false in development
        httpOnly: false, // Allow JavaScript access to cookies
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer persistence
        sameSite: "none", // Allow cross-site cookie setting
        path: "/", // Ensure cookies apply to all paths
        domain:
          process.env.NODE_ENV === "production"
            ? process.env.COOKIE_DOMAIN || undefined
            : undefined,
      },
      name: "storyteller.sid", // Named session for better identification
      rolling: true, // Resets the cookie expiration on every response
      proxy: true, // Trust the reverse proxy (important for Replit deployments)
    }),
  );

  // Middleware to ensure session is properly established for all routes
  app.use((req, res, next) => {
    // Force session initialization for all requests
    if (!req.session) {
      console.error("Session middleware failed to initialize session");
    } else if (
      DEBUG_LOGGING &&
      req.url.startsWith("/api/") &&
      req.url !== "/api/auth/login"
    ) {
      // Only log for API routes that aren't the login endpoint to avoid excessive logging
      console.log(
        `[Session Init] ${req.method} ${req.url} has session: ${!!req.session}, ID: ${req.sessionID}, userId: ${req.session.userId || "none"}`,
      );
    }
    next();
  });

  // Debug middleware to log session information on every request
  if (DEBUG_LOGGING) {
    app.use((req, res, next) => {
      if (req.url.startsWith("/api/")) {
        console.log("[Session Debug] Request to:", req.url, {
          hasSession: !!req.session,
          sessionID: req.sessionID,
          userId: req.session?.userId,
        });
      }
      next();
    });
  }

  // TEMPORARY TEST ROUTE: Auto-login endpoint to bypass Firebase auth while testing
  app.get("/api/auto-login", (req, res) => {
    console.log("[/api/auto-login] Setting test user ID in session");

    if (!req.session) {
      return res.status(500).json({ message: "Session not available" });
    }

    // Set a default user ID for testing
    req.session.userId = "test-user-123";

    req.session.save((err) => {
      if (err) {
        console.error("[/api/auto-login] Failed to save session:", err);
        return res.status(500).json({ message: "Failed to save session" });
      }

      console.log("[/api/auto-login] Session saved successfully:", {
        sessionID: req.sessionID,
        userId: req.session.userId,
      });

      res.status(200).json({
        message: "Test user logged in successfully",
        sessionId: req.sessionID,
        userId: req.session.userId,
      });
    });
  });

  // Using the authenticate middleware imported from ./middleware/auth

  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;

      if (DEBUG_LOGGING) {
        console.log("[/api/auth/login] Received authentication request");
      }

      if (!idToken) {
        console.error("[/api/auth/login] Missing ID token in request");
        return res.status(400).json({ message: "ID token is required" });
      }

      try {
        // Step 1: Verify the Firebase ID token
        if (DEBUG_LOGGING) {
          console.log("[/api/auth/login] Verifying Firebase ID token");
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        if (DEBUG_LOGGING) {
          console.log(
            `[/api/auth/login] Token verified for user: ${decodedToken.email}`,
          );
          console.log(`[/api/auth/login] Firebase UID: ${uid}`);
        }

        // Step 2: Find or create user in our storage
        if (DEBUG_LOGGING) {
          console.log(`[/api/auth/login] Finding user with UID: ${uid}`);
        }

        let user = await storage.getUserByUid(uid);

        if (!user) {
          if (DEBUG_LOGGING) {
            console.log(
              `[/api/auth/login] Creating new user for: ${decodedToken.email}`,
            );
          }

          // Create a new user
          user = await storage.createUser({
            uid,
            email: decodedToken.email || "",
            displayName:
              decodedToken.name || decodedToken.email?.split("@")[0] || "User",
            photoURL: decodedToken.picture || "",
          });

          if (DEBUG_LOGGING) {
            console.log(
              `[/api/auth/login] New user created with ID: ${user.id}`,
            );
          }
        } else if (DEBUG_LOGGING) {
          console.log(
            `[/api/auth/login] Found existing user with ID: ${user.id}`,
          );
        }

        // Step 3: Store user ID in session
        if (!req.session) {
          console.error("[/api/auth/login] Session object not available");
          return res
            .status(500)
            .json({ message: "Session initialization failed" });
        }

        if (DEBUG_LOGGING) {
          console.log(
            "[/api/auth/login] Current session state before modification:",
            {
              sessionID: req.sessionID,
              sessionData: req.session,
            },
          );
        }

        // Set the userId directly on the session
        req.session.userId = String(user.id);

        if (DEBUG_LOGGING) {
          console.log("[/api/auth/login] Session after setting userId:", {
            userId: req.session.userId,
            sessionID: req.sessionID,
          });
        }

        // Step 4: Save the session with a promise to ensure it completes
        try {
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) {
                console.error("[/api/auth/login] Session save error:", err);
                reject(err);
              } else {
                if (DEBUG_LOGGING) {
                  console.log("[/api/auth/login] Session saved successfully");
                }
                resolve();
              }
            });
          });
        } catch (saveError) {
          console.error("[/api/auth/login] Failed to save session:", saveError);
          return res.status(500).json({ message: "Failed to save session" });
        }

        // Step 5: Double-check the session was properly saved
        if (DEBUG_LOGGING) {
          console.log("[/api/auth/login] Final session state:", {
            userId: req.session.userId,
            sessionID: req.sessionID,
            cookie: req.session.cookie,
          });
        }

        res.status(200).json({
          message: "Authenticated successfully",
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          },
        });
      } catch (verifyError: any) {
        // Handle specific Firebase auth errors
        console.error(
          "[/api/auth/login] Firebase token verification error:",
          verifyError,
        );

        let errorMessage = "Invalid authentication token";
        let statusCode = 401;

        // Map Firebase auth error codes to more specific messages
        if (verifyError.code === "auth/id-token-expired") {
          errorMessage =
            "Authentication token has expired. Please sign in again.";
        } else if (verifyError.code === "auth/id-token-revoked") {
          errorMessage =
            "Authentication token has been revoked. Please sign in again.";
        } else if (verifyError.code === "auth/invalid-id-token") {
          errorMessage = "Invalid authentication token. Please sign in again.";
        } else if (verifyError.code === "auth/argument-error") {
          errorMessage = "Invalid authentication token format.";
        } else if (verifyError.code === "auth/user-disabled") {
          errorMessage = "This user account has been disabled.";
          statusCode = 403;
        }

        return res.status(statusCode).json({
          message: errorMessage,
          error: DEBUG_LOGGING ? verifyError.message : undefined,
        });
      }
    } catch (error: any) {
      console.error(
        "[/api/auth/login] Server error during authentication:",
        error,
      );
      res.status(500).json({
        message: "Server error during authentication",
        error: process.env.DEBUG_LOGGING === "true" ? error.message : undefined,
      });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session!.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user data
  app.get("/api/user", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      const user = await storage.getUser(userId!);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const upload = multer({ storage: multer.memoryStorage() });
  app.post(
    "/api/upload",
    upload.single("file"),
    async (req: Request, res: Response) => {
      if (DEBUG_LOGGING)
        console.log("[/api/upload] Received file upload request");
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      try {
        const bucket = getStorage().bucket();
        const filename = `${uuidv4()}${path.extname(file.originalname)}`;
        const fileUpload = bucket.file(filename);
        const blobStream = fileUpload.createWriteStream({
          metadata: {
            contentType: file.mimetype,
            metadata: {
              firebaseStorageDownloadTokens: uuidv4(),
            },
          },
        });
        blobStream.on("error", (err) => {
          if (DEBUG_LOGGING) console.error("[/api/upload] Upload error:", err);
          res
            .status(500)
            .json({ error: "Unable to upload file at the moment." });
        });
        blobStream.on("finish", () => {
          const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
            filename,
          )}?alt=media`;
          if (DEBUG_LOGGING)
            console.log("[/api/upload] File uploaded. Public URL:", publicUrl);
          res.json({ url: publicUrl });
        });
        blobStream.end(file.buffer);
      } catch (err: any) {
        if (DEBUG_LOGGING)
          console.error("[/api/upload] Upload exception:", err);
        res.status(500).json({ error: err.message });
      }
    },
  );

  app.get("/api/jobs/:jobId/progress", (req, res) => {
    const st = jobTracker.get(req.params.jobId);
    console.log(
      `[Progress] Job ${req.params.jobId} requested, returning: ${JSON.stringify(st, null, 2)}`,
    );

    if (!st) return res.json({ phase: "unknown", pct: 0 });
    res.set("Cache-Control", "no-store");
    res.json(st);
  });

  app.get("/api/jobs/:id/stream", (req, res) => {
    const { id } = req.params;
    const first = jobTracker.get(id);

    if (!first) return res.status(404).end();

    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.flushHeaders();

    // send current snapshot
    res.write(`data:${JSON.stringify(first)}\n\n`);

    const onUpdate = (jobId: string, state: JobState) => {
      if (jobId !== id) return;
      res.write(`data:${JSON.stringify(state)}\n\n`);
      res.flush?.();
      if (state.phase === "complete" || state.phase === "error") {
        jobTracker.off("update", onUpdate);
        res.end();
      }
    };

    jobTracker.on("update", onUpdate);
    req.on("close", () => jobTracker.off("update", onUpdate));
  });

  // New Endpoint: Train Custom Model
  // This endpoint uses multer to capture the kidImages from the request.
  app.post("/api/trainModel", async (req: Request, res: Response) => {
    const { imageUrls, captions, kidName, characterId } = req.body;

    if (DEBUG_LOGGING) {
      console.log("[/api/trainModel] 🟢 Incoming request:", {
        imageUrlsLength: imageUrls?.length,
        captionsLength: captions?.length,
        kidName,
        characterId,
      });
    }

    if (!imageUrls || !captions) {
      if (DEBUG_LOGGING) {
        console.warn("[/api/trainModel] ⚠️ Missing imageUrls or captions");
      }
      return res
        .status(400)
        .json({ error: "imageUrls and captions are required." });
    }

    const jobId = jobTracker.newJob(); // -> lib/jobTracker
    res.status(202).json({ characterId, jobId });

    if (DEBUG_LOGGING) {
      console.log("[/api/trainModel] ▶️ Launching background training job");
    }

    (async () => {
      try {
        const modelIdString = await trainCustomModel(
          imageUrls,
          captions,
          kidName,
          jobId,
        );
        await storage.updateCharacter(characterId, { modelId: modelIdString });
        jobTracker.set(jobId, { phase: "complete", pct: 100 });
      } catch (err: any) {
        console.error("[trainModel] error", err);
        jobTracker.set(jobId, { phase: "error", pct: 100, error: err.message });
      }
    })();
  });

  app.get("/api/trainStatus/:characterId", authenticate, async (req, res) => {
    const { characterId } = req.params;
    const character = await storage.getCharacter(characterId);
    if (!character) return res.status(404).json({ error: "not found" });

    if (character.modelId) {
      return res.json({ status: "complete", modelId: character.modelId });
    } else {
      return res.json({ status: "pending" });
    }
  });

  app.post("/api/runValidation", validateStoryInputs);
  // app.post("/api/regenerateScene", regenerateScene);
  // app.post("/api/regenerateBaseCover", regenerateBaseCover);
  // app.post("/api/regenerateFinalCover", regenerateFinalCover);
  // app.post("/api/regenerateFullCover", regenerateFullCover);

  app.post("/api/generateFullStory", authenticate, async (req, res) => {
    console.log("Received request to generate full story with:", req);
    const {
      bookId,
      kidName,
      pronoun,
      age,
      moral,
      storyRhyming,
      kidInterests,
      storyThemes,
      characters,
      characterDescriptions,
      characterImageMap,
    } = req.body;

    if (!bookId) {
      return res.status(400).json({ error: "bookId is required" });
    }

    if (
      !kidName ||
      !pronoun ||
      age === undefined ||
      !moral ||
      storyRhyming === undefined ||
      !kidInterests ||
      !storyThemes
    ) {
      console.log("Received request to generate full story with:", req.body);

      res.status(400).json({
        error:
          "Missing required fields: kidName, pronoun, age, moral, storyRhyming, kidInterests, storyThemes",
      });
      return;
    }

    // Validate arrays
    if (!Array.isArray(kidInterests) || kidInterests.length === 0) {
      res.status(400).json({
        error: "kidInterests must be a non-empty array",
      });
      return;
    }

    if (!Array.isArray(storyThemes) || storyThemes.length === 0) {
      res.status(400).json({
        error: "storyThemes must be a non-empty array",
      });
      return;
    }

    // Validate character arrays
    if (!validateCharacterArrays(characters, characterDescriptions)) {
      res.status(400).json({
        error:
          "characters and characterDescriptions arrays must have the same length",
      });
      return;
    }

    // Currently support max 1 side character
    if (characters.length > 1) {
      res.status(400).json({
        error: "Currently only 0 or 1 side character is supported",
      });
      return;
    }

    const jobId = jobTracker.newJob();
    await storage.updateBook(bookId, { imagesJobId: jobId });
    res.status(202).json({ jobId }); // client begins polling

    (async () => {
      let reasoningTimer: NodeJS.Timeout | null = null;
      const REASON_START_PCT = 10;
      const REASON_END_PCT = 38; // cap for reasoning phase
      const DURATION_MS = 120_000; // ~2 minutes
      const INTERVAL_MS = 1_000; // tick every second
      // how much to bump each tick so we reach MAX over DURATION
      const INCREMENT =
        (REASON_END_PCT - REASON_START_PCT) / (DURATION_MS / INTERVAL_MS);

      try {
        jobTracker.set(jobId, {
          phase: "initializing",
          pct: 0,
          message: "Starting story generation...",
        });

        const { scenes, cover } = await generateCompleteStory(
          {
            kidName,
            pronoun,
            age,
            moral,
            storyRhyming,
            kidInterests,
            storyThemes,
            characters,
            characterDescriptions,
          },
          characterImageMap,
          bookId,
          (phase, pct, msg) => {
            if (phase === "reasoning") {
              // always append the token log
              jobTracker.set(jobId, {
                ...jobTracker.get(jobId)!,
                log: (jobTracker.get(jobId)!.log || "") + msg,
              });

              // start the timer once
              if (!reasoningTimer) {
                reasoningTimer = setInterval(() => {
                  const curr = jobTracker.get(jobId)!.pct ?? REASON_START_PCT;
                  const next = Math.min(curr + INCREMENT, REASON_END_PCT);
                  jobTracker.set(jobId, { phase: "reasoning", pct: next });
                  if (next >= REASON_END_PCT && reasoningTimer) {
                    clearInterval(reasoningTimer);
                  }
                }, INTERVAL_MS);
              }
            } else {
              if (reasoningTimer) {
                clearInterval(reasoningTimer);
                reasoningTimer = null;
              }
              jobTracker.set(jobId, { phase, pct, message: msg });
            }
          },
        );

        // persist & maybe enqueue PDF generation, etc…
        await storage.updateBook(bookId, {
          pages: scenes,
          cover: cover,
          title: cover.story_title,
          imagesJobId: null,
          isStoryRhyming: storyRhyming,
        });
        jobTracker.set(jobId, { phase: "complete", pct: 100 });
      } catch (err: any) {
        console.error("[/api/generateFullStory] error", err);
        jobTracker.set(jobId, { phase: "error", pct: 100, error: err.message });
      }
    })();
  });

  // app.post("/api/regenerateImage", async (req: Request, res: Response) => {
  //   try {
  //     const { bookId, pageId, sceneResponseId, revisedPrompt } = req.body;

  //     const book = await storage.getBookById(bookId);
  //     if (!book) return res.status(404).json({ error: "Book not found" });

  //     /* 1️⃣   identify the page by scene_number */
  //     const oldPage = book.pages?.find((p: any) => p.scene_number === pageId);
  //     if (!oldPage) {
  //       return res.status(400).json({ error: "Page not found" });
  //     }

  //     /* 3️⃣   call your image service */
  //     const { firebaseUrl: newUrl, responseId: newResponseId } =
  //       await regenerateSceneImage(bookId, sceneResponseId, revisedPrompt);

  //     /* 4️⃣   build the updated list */
  //     const updatedPages = book.pages.map((p: any) =>
  //       p.scene_number === pageId
  //         ? { ...p, imageUrl: newUrl, scene_response_id: newResponseId }
  //         : p,
  //     );

  //     /* 5️⃣   persist */
  //     await storage.updateBook(bookId, { pages: updatedPages });

  //     res.status(200).json({ newUrl });
  //   } catch (error: any) {
  //     if (DEBUG_LOGGING) console.error("[/api/regenerateImage] error:", error);
  //     res.status(500).json({
  //       error: error.message || "Image regeneration failed",
  //     });
  //   }
  // });
  app.post("/api/regenerateImage", async (req: Request, res: Response) => {
    try {
      const { bookId, pageId, sceneResponseId, revisedPrompt } = req.body;

      const book = await storage.getBookById(bookId);
      if (!book) return res.status(404).json({ error: "Book not found" });

      const oldPage = book.pages?.find((p: any) => p.scene_number === pageId);
      if (!oldPage) {
        return res.status(400).json({ error: "Page not found" });
      }

      // Get current index or default to 0
      const currentIndex = oldPage.current_scene_index || 0;

      // Use the last response ID if not provided
      const responseId =
        sceneResponseId ||
        getCurrentFromArray(
          oldPage.sceneResponseIds || oldPage.sceneResponseId,
          currentIndex,
        );

      const { firebaseUrl: newUrl, responseId: newResponseId } =
        await regenerateSceneImage(bookId, responseId, revisedPrompt);

      // Ensure arrays exist
      const imageUrls = ensureArray(oldPage.imageUrls || oldPage.imageUrl);
      const responseIds = ensureArray(
        oldPage.sceneResponseIds || oldPage.sceneResponseId,
      );

      // Append new values
      imageUrls.push(newUrl);
      responseIds.push(newResponseId);

      // Update index to point to new image
      const newIndex = imageUrls.length - 1;

      const updatedPages = book.pages.map((p: any) =>
        p.scene_number === pageId
          ? {
              ...p,
              imageUrls, // Store array
              imageUrl: newUrl, // Keep for backwards compatibility
              sceneResponseIds: responseIds, // Store array
              sceneResponseId: newResponseId, // Keep for backwards compatibility
              current_scene_index: newIndex, // Update tracker
            }
          : p,
      );

      await storage.updateBook(bookId, { pages: updatedPages });

      res.status(200).json({ newUrl, newIndex });
    } catch (error: any) {
      if (DEBUG_LOGGING) console.error("[/api/regenerateImage] error:", error);
      res.status(500).json({
        error: error.message || "Image regeneration failed",
      });
    }
  });

  // app.post("/api/regenerateCover", async (req: Request, res: Response) => {
  //   try {
  //     const { bookId, coverInputs, title, coverResponseId, revisedPrompt } =
  //       req.body;

  //     const book = await storage.getBookById(bookId);
  //     if (!book) return res.status(404).json({ error: "Book not found" });

  //     const prevSeed =
  //       book.cover?.base_cover_inputs?.seed ??
  //       book.cover?.final_cover_inputs?.seed ??
  //       3;

  //     const seed = Math.floor(Math.random() * 1_000_000);

  //     // const newBaseCoverUrl = await regenerateBaseCoverImage(coverInputs, seed);
  //     const { firebaseUrl: newBaseCoverUrl, responseId: newResponseId } =
  //       await regenerateBaseCoverImage(bookId, coverResponseId, revisedPrompt);

  //     // Then add title to create final cover
  //     const newFinalCoverUrl = await generateFinalCoverWithTitle(
  //       bookId,
  //       newBaseCoverUrl,
  //       title,
  //       seed,
  //     );

  //     const updatedCover = {
  //       ...book.cover,
  //       base_cover_inputs: { ...coverInputs, seed },
  //       final_cover_inputs: { ...(book.cover?.final_cover_inputs ?? {}), seed },
  //       base_cover_url: newBaseCoverUrl,
  //       final_cover_url: newFinalCoverUrl,
  //       base_cover_response_id: newResponseId,
  //     };

  //     console.log("updatedCover:", updatedCover);
  //     await storage.updateBook(bookId, { cover: updatedCover });

  //     res.status(200).json({ newUrl: newFinalCoverUrl });
  //   } catch (error: any) {
  //     if (DEBUG_LOGGING)
  //       console.error(
  //         "[/api/regenerateImage] Image regeneration error:",
  //         error,
  //       );
  //     res
  //       .status(500)
  //       .json({ error: error.message || "Image regeneration failed" });
  //   }
  // });

  app.post("/api/regenerateCover", async (req: Request, res: Response) => {
    try {
      const { bookId, coverInputs, title, coverResponseId, revisedPrompt } =
        req.body;

      const book = await storage.getBookById(bookId);
      if (!book) return res.status(404).json({ error: "Book not found" });

      // Get current index or default to 0
      const currentIndex = book.cover?.current_base_cover_index || 0;

      // Use the last response ID if not provided
      const responseId =
        coverResponseId ||
        getCurrentFromArray(
          book.cover?.base_cover_response_ids ||
            book.cover?.base_cover_response_id,
          currentIndex,
        );

      const seed = Math.floor(Math.random() * 1_000_000);

      const { firebaseUrl: newBaseCoverUrl, responseId: newResponseId } =
        await regenerateBaseCoverImage(bookId, responseId, revisedPrompt);

      const newFinalCoverUrl = await generateFinalCoverWithTitle(
        bookId,
        newBaseCoverUrl,
        title,
        seed,
      );

      // Ensure arrays exist
      const baseCoverUrls = ensureArray(
        book.cover?.base_cover_urls || book.cover?.base_cover_url,
      );
      const finalCoverUrls = ensureArray(
        book.cover?.final_cover_urls || book.cover?.final_cover_url,
      );
      const responseIds = ensureArray(
        book.cover?.base_cover_response_ids ||
          book.cover?.base_cover_response_id,
      );

      // Append new values
      baseCoverUrls.push(newBaseCoverUrl);
      finalCoverUrls.push(newFinalCoverUrl);
      responseIds.push(newResponseId);

      // Update indices
      const newIndex = baseCoverUrls.length - 1;

      const updatedCover = {
        ...book.cover,
        base_cover_inputs: { ...coverInputs, seed },
        final_cover_inputs: { ...(book.cover?.final_cover_inputs ?? {}), seed },
        base_cover_urls: baseCoverUrls, // Store array
        base_cover_url: newBaseCoverUrl, // Keep for backwards compatibility
        final_cover_urls: finalCoverUrls, // Store array
        final_cover_url: newFinalCoverUrl, // Keep for backwards compatibility
        base_cover_response_ids: responseIds, // Store array
        base_cover_response_id: newResponseId, // Keep for backwards compatibility
        current_base_cover_index: newIndex, // Update tracker
        current_final_cover_index: newIndex, // Update tracker
      };

      await storage.updateBook(bookId, { cover: updatedCover });

      res.status(200).json({ newUrl: newFinalCoverUrl, newIndex });
    } catch (error: any) {
      if (DEBUG_LOGGING) console.error("[/api/regenerateCover] error:", error);
      res
        .status(500)
        .json({ error: error.message || "Image regeneration failed" });
    }
  });

  app.post("/api/toggleImageVersion", async (req: Request, res: Response) => {
    try {
      const { bookId, pageId, targetIndex } = req.body;

      const book = await storage.getBookById(bookId);
      if (!book) return res.status(404).json({ error: "Book not found" });

      if (pageId === 0) {
        // Handle cover toggle
        const baseCoverUrls = ensureArray(
          book.cover?.base_cover_urls || book.cover?.base_cover_url,
        );
        const finalCoverUrls = ensureArray(
          book.cover?.final_cover_urls || book.cover?.final_cover_url,
        );

        const newIndex = Math.max(
          0,
          Math.min(targetIndex, baseCoverUrls.length - 1),
        );

        const updatedCover = {
          ...book.cover,
          current_base_cover_index: newIndex,
          current_final_cover_index: newIndex,
          base_cover_url: baseCoverUrls[newIndex], // Update compatibility field
          final_cover_url: finalCoverUrls[newIndex], // Update compatibility field
        };

        await storage.updateBook(bookId, { cover: updatedCover });

        res.status(200).json({
          newUrl: finalCoverUrls[newIndex],
          newIndex,
          totalVersions: baseCoverUrls.length,
        });
      } else {
        // Handle page toggle
        const page = book.pages?.find((p: any) => p.scene_number === pageId);
        if (!page) return res.status(404).json({ error: "Page not found" });

        const imageUrls = ensureArray(page.imageUrls || page.imageUrl);
        const newIndex = Math.max(
          0,
          Math.min(targetIndex, imageUrls.length - 1),
        );

        const updatedPages = book.pages.map((p: any) =>
          p.scene_number === pageId
            ? {
                ...p,
                current_scene_index: newIndex,
                imageUrl: imageUrls[newIndex], // Update compatibility field
              }
            : p,
        );

        await storage.updateBook(bookId, { pages: updatedPages });

        res.status(200).json({
          newUrl: imageUrls[newIndex],
          newIndex,
          totalVersions: imageUrls.length,
        });
      }
    } catch (error: any) {
      if (DEBUG_LOGGING)
        console.error("[/api/toggleImageVersion] error:", error);
      res.status(500).json({ error: error.message || "Toggle version failed" });
    }
  });

  app.post("/api/regenerateCoverTitle", async (req: Request, res: Response) => {
    try {
      const { bookId, baseCoverUrl, title, randomSeed } = req.body;

      const book = await storage.getBookById(bookId);
      if (!book) return res.status(404).json({ error: "Book not found" });

      const prevSeed = book.cover?.final_cover_inputs?.seed ?? 3;

      const seed = randomSeed
        ? Math.floor(Math.random() * 1_000_000)
        : prevSeed;

      // Then add title to create final cover
      const newFinalCoverUrl = await generateFinalCoverWithTitle(
        bookId,
        baseCoverUrl,
        title,
        seed,
      );

      const updatedCover = {
        ...book.cover,
        final_cover_inputs: {
          ...(book.cover?.final_cover_inputs ?? {}),
          seed,
          story_title: title,
        },
        final_cover_url: newFinalCoverUrl,
      };

      console.log("updatedCover:", updatedCover);
      await storage.updateBook(bookId, { cover: updatedCover, title: title });

      res.status(200).json({ newUrl: newFinalCoverUrl });
    } catch (error: any) {
      if (DEBUG_LOGGING)
        console.error(
          "[/api/regenerateImage] Image regeneration error:",
          error,
        );
      res
        .status(500)
        .json({ error: error.message || "Image regeneration failed" });
    }
  });

  app.post("/api/regenerateAvatar", async (req, res) => {
    const { bookId, modelId, prompt, loraScale, stylePreference } = req.body;
    const seed = 3.0;
    const fullPrompt = buildFullPrompt(stylePreference, prompt, false);
    const url = await generateImage(fullPrompt, modelId, loraScale, seed);

    await storage.updateBook(bookId, {
      avatarUrl: url,
      avatarLora: loraScale,
    });

    res.json({ avatarUrl: url });
  });

  app.put(
    "/api/characters/:id",
    authenticate, // ensure only the logged-in user can update
    async (req: Request, res: Response) => {
      const { id } = req.params;
      // 1) Strip out any userId (or other fields) that we don't want to allow clients to override
      const { userId, ...updates } = req.body;

      try {
        // 2) Fetch the existing record and verify ownership
        const existing = await storage.getCharacter(id);
        if (!existing) {
          return res.status(404).json({ message: "Character not found" });
        }
        if (existing.userId !== req.session!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        // 3) Merge only the allowed fields
        await storage.updateCharacter(id, updates);

        // 4) Re-fetch the full, merged document and return it
        const full = await storage.getCharacter(id);
        return res.status(200).json(full);
      } catch (err: any) {
        console.error("[PUT /api/characters/:id] error:", err);
        return res.status(500).json({ error: "Failed to update character" });
      }
    },
  );

  // Character routes with authentication middleware
  app.post(
    "/api/characters",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        // User is already authenticated by middleware
        const userId = req.session!.userId!.toString();

        if (DEBUG_LOGGING) {
          console.log(`[/api/characters POST] User authenticated: ${userId}`);
          console.log("[/api/characters POST] Request body:", req.body);
        }

        const validatedData = insertCharacterSchema.parse({
          ...req.body,
          userId,
        });

        const character = await storage.createCharacter(validatedData);

        if (DEBUG_LOGGING) {
          console.log("[/api/characters POST] Character created:", character);
        }

        res.status(201).json(character);
      } catch (error: any) {
        console.error("[/api/characters POST] Error:", error);
        res.status(400).json({
          message: "Invalid character data",
          error: error.errors || error.message || {},
        });
      }
    },
  );

  app.get(
    "/api/characters/:id",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const character = await storage.getCharacter(id);

        if (!character) {
          return res.status(404).json({ message: "Character not found" });
        }

        // Verify the character belongs to the authenticated user if it's a custom character
        if (
          character.type === "custom" &&
          character.userId !== req.session!.userId
        ) {
          return res.status(403).json({ message: "Access denied" });
        }

        res.status(200).json(character);
      } catch (error: any) {
        console.error("Error fetching character by id:", error);
        res.status(500).json({ message: "Server error", error: error.message });
      }
    },
  );

  app.get("/api/characters", async (req: Request, res: Response) => {
    try {
      const { type } = req.query;

      if (DEBUG_LOGGING) {
        console.log(`[/api/characters GET] Query params:`, req.query);
      }

      let characters;

      if (type === "predefined") {
        if (DEBUG_LOGGING) {
          console.log("[/api/characters GET] Fetching predefined characters");
        }
        characters = await storage.getCharactersByType("predefined");
      } else {
        // Custom characters require authentication
        if (!req.session || !req.session.userId) {
          if (DEBUG_LOGGING) {
            console.log(
              "[/api/characters GET] Authentication failed for custom characters:",
              {
                hasSession: !!req.session,
                sessionID: req.sessionID,
              },
            );
          }
          return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.session.userId.toString();

        if (DEBUG_LOGGING) {
          console.log(
            `[/api/characters GET] Fetching characters for user: ${userId}`,
          );
        }

        characters = await storage.getCharactersByUserId(userId);
      }

      if (DEBUG_LOGGING) {
        console.log(
          `[/api/characters GET] Found ${characters.length} characters`,
        );
      }

      res.status(200).json(characters);
    } catch (error: any) {
      console.error("[/api/characters GET] Error:", error);
      res.status(500).json({
        message: "Failed to fetch characters",
        error: error.message || {},
      });
    }
  });

  // Story routes with authentication middleware
  app.post(
    "/api/stories",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        // User is already authenticated by middleware
        const userId = req.session!.userId!.toString();

        if (DEBUG_LOGGING) {
          console.log(`[/api/stories POST] User authenticated: ${userId}`);
          console.log("[/api/stories POST] Request body:", req.body);
        }

        const validatedData = insertStorySchema.parse({
          ...req.body,
          userId,
        });

        const story = await storage.createStory(validatedData);

        if (DEBUG_LOGGING) {
          console.log("[/api/stories POST] Story created:", story);
        }

        res.status(201).json(story);
      } catch (error: any) {
        console.error("[/api/stories POST] Error:", error);
        res.status(400).json({
          message: "Invalid story data",
          error: error.errors || error.message || {},
        });
      }
    },
  );

  app.get(
    "/api/stories/:id",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const story = await storage.getStory(id);

        if (!story) {
          return res.status(404).json({ message: "Story not found" });
        }

        // Verify the character belongs to the authenticated user if it's a custom character
        if (story.type === "custom" && story.userId !== req.session!.userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        res.status(200).json(story);
      } catch (error: any) {
        console.error("Error fetching story by id:", error);
        res.status(500).json({ message: "Server error", error: error.message });
      }
    },
  );

  app.get("/api/stories", async (req: Request, res: Response) => {
    try {
      const { type } = req.query;

      if (DEBUG_LOGGING) {
        console.log(`[/api/stories GET] Query params:`, req.query);
      }

      let stories;

      if (type === "predefined") {
        if (DEBUG_LOGGING) {
          console.log("[/api/stories GET] Fetching predefined stories");
        }

        stories = await storage.getStoriesByType("predefined");

        // Type safety fix for the groupedStories
        const groupedStories: Record<string, any[]> = {
          "3-5": [],
          "6-8": [],
          "9-12": [],
        };

        stories.forEach((story) => {
          // Use a safe fallback if ageGroup is not present
          const ageGroup = (story as any).ageGroup || "3-5";
          groupedStories[ageGroup].push(story);
        });

        if (DEBUG_LOGGING) {
          console.log("[/api/stories GET] Grouped predefined stories by age:", {
            total: stories.length,
            byAge: {
              "3-5": groupedStories["3-5"].length,
              "6-8": groupedStories["6-8"].length,
              "9-12": groupedStories["9-12"].length,
            },
          });
        }

        return res.status(200).json(groupedStories);
      } else {
        // Custom stories require authentication
        if (!req.session || !req.session.userId) {
          if (DEBUG_LOGGING) {
            console.log(
              "[/api/stories GET] Authentication failed for user stories:",
              {
                hasSession: !!req.session,
                sessionID: req.sessionID,
              },
            );
          }
          return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.session.userId.toString();

        if (DEBUG_LOGGING) {
          console.log(
            `[/api/stories GET] Fetching stories for user: ${userId}`,
          );
        }

        stories = await storage.getStoriesByUserId(userId);

        if (DEBUG_LOGGING) {
          console.log(
            `[/api/stories GET] Found ${stories.length} stories for user ${userId}`,
          );
        }

        res.status(200).json(stories);
      }
    } catch (error: any) {
      console.error("[/api/stories GET] Error:", error);
      res.status(500).json({
        message: "Failed to fetch stories",
        error: error.message || {},
      });
    }
  });
  // Book routes with authentication
  app.post("/api/books", authenticate, async (req: Request, res: Response) => {
    try {
      // User is already authenticated by the middleware
      const userId = req.session!.userId!.toString();

      if (DEBUG_LOGGING) {
        console.log(`[/api/books POST] User authenticated: ${userId}`);
        console.log("[/api/books POST] Received book data:", {
          ...req.body,
          userId,
        });
      }

      const validatedData = insertBookSchema.parse({
        ...req.body,
        userId,
      });

      const book = await storage.createBook(validatedData);

      if (DEBUG_LOGGING) {
        console.log("[/api/books POST] Book created successfully:", book);
      }

      res.status(201).json(book);
    } catch (error: any) {
      console.error("[/api/books POST] Error creating book:", error);
      res.status(400).json({
        message: "Invalid book data",
        error: error.errors || error.message || {},
      });
    }
  });

  app.get("/api/books", authenticate, async (req: Request, res: Response) => {
    try {
      // User is already authenticated by the middleware
      const userId = req.session!.userId!.toString();

      if (DEBUG_LOGGING) {
        console.log(`[/api/books GET] User authenticated: ${userId}`);
      }

      const books = await storage.getBooksByUserId(userId);

      if (DEBUG_LOGGING) {
        console.log(
          `[/api/books GET] Found ${books.length} books for user ${userId}`,
        );
      }

      res.status(200).json(books);
    } catch (error: any) {
      console.error("[/api/books GET] Error:", error);
      res.status(500).json({
        message: "Failed to fetch books",
        error: error.message || {},
      });
    }
  });

  app.get(
    "/api/books/:id",
    authenticate,
    async (req: Request, res: Response) => {
      const { id } = req.params;
      console.log("routes.ts - GET /api/books/:id called with id:", id);
      try {
        const book = await storage.getBookById(id);
        if (!book) {
          console.log("routes.ts - Book not found for id:", id);
          return res.status(404).json({ error: "Book not found" });
        }

        // Verify that the book belongs to the authenticated user
        if (book.userId !== req.session!.userId) {
          console.log("routes.ts - Book access denied, wrong user:", {
            bookUserId: book.userId,
            sessionUserId: req.session!.userId,
          });
          return res.status(403).json({ error: "Access denied" });
        }

        console.log("routes.ts - Returning book for id:", id, book);
        return res.status(200).json(book);
      } catch (error) {
        console.error(
          "routes.ts - Error in GET /api/books/:id for id:",
          id,
          error,
        );
        return res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  app.put("/api/books/:id", async (req: Request, res: Response) => {
    try {
      // Ensure the user is authenticated.
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.session.userId.toString();
      const bookId = req.params.id;
      console.log(`request to update book ${req.body.pages} by user`);
      // Validate the incoming data using insertBookSchema (or a dedicated update schema)
      const updatedData = updateBookSchema.parse({
        ...req.body,
        userId,
      });

      // Update the book using a storage function.
      // You need to implement storage.updateBook if not already available.
      const updatedBook = await storage.updateBook(bookId, updatedData);
      if (!updatedBook) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.status(200).json(updatedBook);
    } catch (error: any) {
      console.error("[/api/books PUT] Error updating book:", error);
      res.status(400).json({
        message: "Failed to update book",
        error: error.message || error,
      });
    }
  });

  app.patch("/api/books/:id", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session!.userId!.toString();

      const existing = await storage.getBookById(id);
      if (!existing || existing.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      /* ----------------------------------------------------------
         ❶  Is this the “update just one page” payload?
            { pages: [ { id: <number>, content: <string> } ] }
      ---------------------------------------------------------- */
      if (
        Array.isArray(req.body.pages) &&
        req.body.pages.length === 1 &&
        typeof req.body.pages[0].id === "number" &&
        typeof req.body.pages[0].content === "string"
      ) {
        const { id: pageId, content } = req.body.pages[0];
        const updated = await storage.updateBookPageContent(
          id,
          pageId,
          content,
        );
        return res.json(updated);
      }

      const updated = await storage.updateBook(id, { ...req.body });
      res.json(updated);
    } catch (err: any) {
      console.error("[books PATCH] error:", err);
      res
        .status(500)
        .json({ message: "Failed to update book", error: err.message });
    }
  });

  app.post(
    "/api/cartoonify",
    authenticate,
    async (req: Request, res: Response) => {
      const { characterId, imageUrl } = req.body;
      if (!characterId || !imageUrl) {
        return res
          .status(400)
          .json({ error: "characterId + imageUrl required" });
      }

      try {
        const toonUrl = await cartoonifyImage(imageUrl);
        await storage.updateCharacter(characterId, { toonUrl });

        return res.status(200).json({ toonUrl });
      } catch (err: any) {
        console.error("[/api/cartoonify] error:", err);
        return res
          .status(500)
          .json({ error: "Cartoonify failed", details: err.message });
      }
    },
  );

  // Order routes with authentication
  app.post("/api/orders", authenticate, async (req: Request, res: Response) => {
    try {
      // User is already authenticated by middleware
      const userId = req.session!.userId!.toString();

      if (DEBUG_LOGGING) {
        console.log("[/api/orders POST] Auth validated, userId:", userId);
        console.log("[/api/orders POST] Request body:", req.body);
      }

      const validatedData = insertOrderSchema.parse({
        ...req.body,
        userId,
      });

      const order = await storage.createOrder(validatedData);

      if (DEBUG_LOGGING) {
        console.log("[/api/orders POST] Order created:", order);
      }

      res.status(201).json(order);
    } catch (error: any) {
      console.error("[/api/orders POST] Error:", error);
      res.status(400).json({
        message: "Invalid order data",
        error: error.errors || error.message || {},
      });
    }
  });

  app.get("/api/orders", authenticate, async (req: Request, res: Response) => {
    try {
      // User is already authenticated by middleware
      const userId = req.session!.userId!.toString();

      if (DEBUG_LOGGING) {
        console.log("[/api/orders GET] Auth validated, userId:", userId);
        console.log("[/api/orders GET] Request body:", req.body);
      }

      // const validatedData = insertOrderSchema.parse({
      //   ...req.body,
      //   userId,
      // });
      const orders = await storage.getOrdersByUserId(userId);

      if (DEBUG_LOGGING) {
        console.log("[/api/orders POST] Order created:", orders);
      }

      res.status(201).json(orders);
    } catch (error: any) {
      console.error("[/api/orders POST] Error:", error);
      res.status(400).json({
        message: "Invalid order data",
        error: error.errors || error.message || {},
      });
    }
  });

  // PDF generation - no authentication required
  app.post("/api/pdf/generate", async (req: Request, res: Response) => {
    console.log("[routes] /api/pdf/generate hit with body:", req.body);
    let size = 0;
    req.on("data", (chunk) => (size += chunk.length));
    req.on("end", () => console.log("Request size in bytes:", size));
    try {
      const { title, pages, coverUrl, backCoverUrl } = req.body;

      const buffer = await generatePDF(title, pages, coverUrl, backCoverUrl);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${title.replace(/\s+/g, "_")}.pdf"`,
      );

      res.send(buffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: "Failed to generate PDF", error });
    }
  });

  app.post(
    "/api/books/:bookId/prepareSplit",
    async (req: Request, res: Response) => {
      console.log("[routes] prepareSplit hit:", req.params.bookId);
      const bookId = req.params.bookId;

      const book = await storage.getBookById(bookId);
      const pages = book.pages;
      if (!Array.isArray(pages)) {
        return res.status(400).json({ message: "Missing pages array" });
      }

      const alreadyDone =
        !!book.cover?.back_cover_url &&
        book.pages.length === pages.length &&
        book.pages.every((p) => p.final_scene_url != null);
      if (alreadyDone) {
        console.log("prepareSplit: cached book — returning immediately");
        return res.json({ pages: book.pages });
      }

      const jobId = req.get("x-client-job") ?? jobTracker.newJob();
      res.setHeader("X-Job-Id", jobId);
      res.setHeader("Access-Control-Expose-Headers", "X-Job-Id");
      res.status(202).json({ jobId });

      (async () => {
        try {
          // 1) Expand back cover if needed

          jobTracker.set(jobId, {
            phase: "expandingCover",
            pct: 5,
            message: "Creating back cover…",
          });

          console.log(`url: ${book.cover.base_cover_url}`);

          if (!book.cover?.back_cover_url) {
            const backUrl = await expandImageToLeft(book.cover.base_cover_url);
            await storage.updateBook(bookId, {
              cover: { ...book.cover, back_cover_url: backUrl },
            });
          }

          // 2) PHASE 1: Expand all page images in parallel
          console.log(
            `[prepareSplit] Starting image expansion for ${pages.length} pages`,
          );
          jobTracker.set(jobId, {
            phase: "expandingImages",
            pct: 15,
            message: "Expanding page images…",
          });

          const isRhyming = Boolean(book.isStoryRhyming);
          const storedPages = book.pages; // contains pre-assigned side

          // Expand all images in parallel
          console.log(
            `[prepareSplit] Expanding ${pages.length} images in parallel...`,
          );

          const expandedPages = await Promise.all(
            pages.map(async (page, idx) => {
              console.log(
                `[prepareSplit] Expanding page ${idx + 1}/${pages.length}: ${page.scene_number}`,
              );
              const pageSide: "left" | "right" = pages[idx]?.side || "left";

              // Expand the scene image based on side
              const expandedUrl = page.expanded_scene_url
                ? page.expanded_scene_url
                : pageSide === "left"
                  ? await expandImageToLeft(page.imageUrl)
                  : await expandImageToRight(page.imageUrl);
              console.log(
                `[prepareSplit] Page ${idx + 1} expanded: ${expandedUrl}`,
              );
              // const expandedUrl =
              //   "https://v3.fal.media/files/tiger/LfKPl6vdMmKXuAF2X_OjI_67831c38bc95428793087c8908604d19.png";
              return {
                ...page,
                expanded_scene_url: expandedUrl, // Store expanded URL
              };
            }),
          );

          console.log(
            `[prepareSplit] All ${expandedPages.length} images expanded successfully`,
          );

          console.log(
            `[prepareSplit] About to update book with expanded URLs...`,
          );
          // Update book with expanded URLs
          await storage.updateBook(bookId, {
            pages: expandedPages.map((page) => ({
              ...(storedPages.find(
                (p) => p.scene_number === page.scene_number,
              ) || {}),
              ...page,
            })),
          });
          console.log(`[prepareSplit] Book updated successfully`);

          console.log(
            `[prepareSplit] Book updated with expanded URLs, moving to text overlay phase`,
          );
          jobTracker.set(jobId, {
            phase: "expandingComplete",
            pct: 35,
            message: "Image expansion complete. Starting text overlay…",
          });
          console.log(
            `[prepareSplit] Progress updated to expandingComplete phase`,
          );

          // 3) PHASE 2: Process text overlay in batches of 3

          const batchSize = 3;
          const processedPages = [];
          let completed = 0;

          console.log(
            `[prepareSplit] Starting text overlay processing with ${expandedPages.length} pages in batches of ${batchSize}`,
          );

          for (let i = 0; i < expandedPages.length; i += batchSize) {
            const batch = expandedPages.slice(i, i + batchSize);
            console.log(
              `[prepareSplit] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(expandedPages.length / batchSize)}`,
            );

            jobTracker.set(jobId, {
              phase: "processingBatch",
              pct: 35 + Math.round((i / expandedPages.length) * 50),
              message: `Processing text overlay batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(expandedPages.length / batchSize)}…`,
            });

            // Process current batch in parallel
            const batchResults = await Promise.all(
              batch.map(async (page) => {
                let hint;
                if (page.content) {
                  try {
                    // Use the expanded URL for text overlay
                    hint = await getOverlayHint(
                      page.expanded_scene_url, // Use expanded URL
                      page.content, // now always string[]
                      page.side,
                      isRhyming,
                      {
                        fontSize: DEFAULT_FONT_ENLARGED_SIZE,
                        fontFamily: DEFAULT_FONT_FAMILY,
                        debugMode: false,
                      },
                    );
                  } catch (err) {
                    console.warn(
                      `[prepareSplit] overlay-text failed for page ${page.id}, using defaults:`,
                      err,
                    );
                    // Fallback to defaults if overlay API fails
                    hint = {
                      startX: FULL_W / 2 - 100,
                      startY: FULL_H / 2 - 25,
                      side: page.side,
                      color: DEFAULT_COLOR,
                      lines: isRhyming
                        ? page.content
                        : Array.isArray(page.content)
                          ? page.content
                          : [page.content],
                      imageWidth: FULL_W,
                      imageHeight: FULL_H,
                      fontSize: DEFAULT_FONT_ENLARGED_SIZE,
                      fontFamily: DEFAULT_FONT_FAMILY,
                    };
                  }
                } else {
                  hint = {
                    startX: 0,
                    startY: 0,
                    side: page.side,
                    color: DEFAULT_COLOR,
                    lines: [],
                    imageWidth: FULL_W,
                    imageHeight: FULL_H,
                    fontSize: DEFAULT_FONT_ENLARGED_SIZE,
                    fontFamily: DEFAULT_FONT_FAMILY,
                  };
                }

                const m = mapHint(hint as OverlayHint);

                // Assemble output
                const out: any = {
                  ...page,
                  final_scene_url: page.expanded_scene_url, // Use expanded URL as final
                  width: 400,
                  height: 100,
                  fontSize: m.fontSize,
                  leftTextColor: hint.color,
                  rightTextColor: hint.color,
                };

                if (hint.side === "left") {
                  out.leftX = m.x;
                  out.leftY = m.y;
                  out.leftText = hint.lines;
                } else {
                  out.rightX = m.x;
                  out.rightY = m.y;
                  out.rightText = hint.lines;
                }

                // Progress update
                completed++;
                jobTracker.set(jobId, {
                  phase: "generating",
                  pct: 35 + Math.round((completed / expandedPages.length) * 55),
                  message: `Page ${completed}/${expandedPages.length}`,
                });

                return out;
              }),
            );

            processedPages.push(...batchResults);

            // Small delay between batches to be gentle on the text overlay API
            if (i + batchSize < expandedPages.length) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          // 4) Final update with all processed pages
          console.log(
            `[prepareSplit] About to update book with final processed pages...`,
          );
          await storage.updateBook(bookId, { pages: processedPages });
          console.log(`[prepareSplit] Final book update completed`);

          jobTracker.set(jobId, {
            phase: "complete",
            pct: 100,
            message: "Pages ready",
          });
          console.log(`[prepareSplit] Job marked as complete`);

          await new Promise((resolve) => setTimeout(resolve, 1000));

          console.log(
            `[prepareSplit] Successfully processed ${processedPages.length} pages in batches`,
          );
        } catch (error) {
          console.error("prepareSplit error:", error);
          jobTracker.set(jobId, {
            phase: "error",
            pct: 100,
            error: String(error),
          });
        }
      })();
    },
  );

  return httpServer;
}
