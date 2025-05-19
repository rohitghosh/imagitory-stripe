import type { Express, Request, Response, NextFunction } from "express";
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
  regenerateImagePromptsFromScenes,
  generateGuidedImage,
} from "./utils/trainAndGenerate";
import admin from "./firebaseAdmin";
import createMemoryStore from "memorystore";
import { splitImageInHalf } from "./utils/elementGeneration";
import { pickContrastingTextColor } from "./utils/textColorUtils";
import { loadBase64Image } from "./utils/layouts";
import { uploadBase64ToFirebase } from "./utils/uploadImage";
import { jobTracker } from "./lib/jobTracker";

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

// Extend Express Session type to include userId
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
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
    if (!st) return res.json({ phase: "unknown", pct: 0 });
    res.set("Cache-Control", "no-store");
    res.json(st);
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

  // New Endpoint: Generate Story
  // Expects: kidName, modelId, baseStoryPrompt, and moral in the request body.
  // New Endpoint: Generate Story
  // Expects kidName, modelId, baseStoryPrompt, and moral in the request body.
  // POST /api/generateStory
  app.post("/api/generateStory", authenticate, async (req, res) => {
    let {
      jobId,
      kidName,
      modelId,
      baseStoryPrompt,
      moral,
      title,
      age,
      gender,
      stylePreference,
      storyRhyming,
      storyTheme,
    } = req.body;

    if (!jobId) jobId = jobTracker.newJob();

    // 1) Quick validation
    if (!kidName || !modelId || !baseStoryPrompt || !moral || !title) {
      return res.status(400).json({
        error:
          "kidName, modelId, baseStoryPrompt, moral and title are required.",
      });
    }

    if (!jobId) return res.status(400).json({ error: "jobId required" });
    jobTracker.set(jobId, {
      phase: "prompting",
      pct: 60,
      message: "LLM scene prompts…",
    });
    res.status(202).json({ jobId });

    if (DEBUG_LOGGING) console.log("[/api/generateStory] jobId:", jobId);

    const seed = 3.0;

    generateStoryImages(
      jobId,
      modelId,
      kidName,
      baseStoryPrompt,
      moral,
      title,
      age,
      gender,
      stylePreference,
      storyRhyming,
      storyTheme,
      seed,
    ).catch((err) => {
      console.error("[/api/generateStory] background error:", err);
      jobTracker.set(jobId, { phase: "error", pct: 100, error: err.message });
    });
  });

  app.get("/api/generateStatus/:jobId", (req, res) => {
    const st = jobTracker.get(req.params.jobId);
    if (!st) return res.status(404).json({ error: "Job not found" });
    res.set("Cache-Control", "no-store");
    res.json(st);
  });

  app.post("/api/regenerateImage", async (req: Request, res: Response) => {
    try {
      const {
        bookId,
        pageId,
        modelId,
        prompt,
        isCover,
        kidName,
        age,
        gender,
        stylePreference,
        loraScale,
        avatarUrl,
        controlLoraStrength,
        randomSeed,
      } = req.body;

      const seed = randomSeed ? Math.floor(Math.random() * 1_000_000) : 3.0;
      const fullPrompt = buildFullPrompt(stylePreference, age, gender, prompt);
      const width = isCover ? 512 : 1024;
      const newUrl = await generateGuidedImage(
        fullPrompt,
        avatarUrl,
        modelId,
        loraScale,
        seed,
        controlLoraStrength,
        width,
      );

      console.log(
        "lorascale and controlStrength",
        loraScale,
        controlLoraStrength,
      );

      const book = await storage.getBookById(bookId);
      if (!book) return res.status(404).json({ error: "Book not found" });

      // Build new pages array
      let updatedPages = book.pages;
      if (isCover) {
        book.coverUrl = newUrl;
        (book as any).coverLoraScale = loraScale;
        (book as any).coverControlLoraStrength = controlLoraStrength;
      } else {
        updatedPages = book.pages.map((p: any) =>
          p.id === pageId
            ? { ...p, imageUrl: newUrl, loraScale, controlLoraStrength }
            : p,
        );
      }

      await storage.updateBook(bookId, {
        coverUrl: book.coverUrl,
        backCoverUrl: book.backCoverUrl,
        pages: updatedPages,
        coverLoraScale: (book as any).coverLoraScale,
        coverControlLoraStrength: (book as any).coverControlLoraStrength,
      });
      res.status(200).json({ newUrl });
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
    const { bookId, modelId, prompt, loraScale } = req.body;
    const seed = 3.0;
    const url = await generateImage(prompt, modelId, loraScale, seed);

    await storage.updateBook(bookId, {
      avatarUrl: url,
      avatarLora: loraScale,
    });

    res.json({ avatarUrl: url });
  });

  app.put("/api/characters/:id", async (req, res) => {
    const { id } = req.params;
    const payload = req.body; // This could include { modelId: 'newId', trainedAt: Date.now(), ... }
    try {
      const updatedCharacter = await storage.updateCharacter(id, payload);
      res.status(200).json(updatedCharacter);
    } catch (error) {
      res.status(500).json({ error: "Failed to update character" });
    }
  });

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

      // Validate the incoming data using insertBookSchema (or a dedicated update schema)
      const updatedData = insertBookSchema.parse({
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

  app.patch("/api/books/:id/meta", authenticate, async (req, res) => {
    const { id } = req.params;
    const { avatarFinalized } = req.body;
    try {
      const updated = await storage.updateBook(id, { avatarFinalized });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: "Failed to update book meta" });
    }
  });

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
  // app.post("/api/pdf/generate", async (req: Request, res: Response) => {
  //   try {
  //     const { title, pages, coverUrl, backCoverUrl, storyPrompt } = req.body;

  //     // const newPages = pages.slice(0, 8);
  //     const newPages = pages;

  //     // const layout = "side-by-side";
  //     let borderImages = undefined;
  //     // let backgroundImageBase64 = undefined;

  //     // if (layout == "side-by-side") {
  //     //   pageBackgrounds = await generatePageBackgrounds(newPages, "side-by-side");
  //     // }

  //     // const theme = inferTheme(storyPrompt);
  //     borderImages = await generateDecorativeBordersForPages(8, "space");

  //     // console.log(pageBackgrounds);

  //     const buffer = await generateStackedPDF(
  //       title,
  //       newPages,
  //       coverUrl,
  //       backCoverUrl,
  //       borderImages,
  //     );

  //     res.setHeader("Content-Type", "application/pdf");
  //     res.setHeader(
  //       "Content-Disposition",
  //       `attachment; filename="${title.replace(/\s+/g, "_")}.pdf"`,
  //     );

  //     res.send(buffer);
  //   } catch (error) {
  //     console.error("PDF generation error:", error);
  //     res.status(500).json({ message: "Failed to generate PDF", error });
  //   }
  // });

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
      console.log("[routes] /api/books/:bookId/prepareSplit hit");

      console.log(
        "[routes] /api/books/:bookId/prepareSplit hit with body:",
        req.body,
      );

      try {
        const bookId = req.params.bookId; // from the URL
        const { pages } = req.body; // now parsed by express.json

        if (!Array.isArray(pages)) {
          return res.status(400).json({ message: "Missing pages array" });
        }
        console.log("[routes] pages.length=", pages.length);
        // Check if pages are already processed
        const book = await storage.getBookById(bookId);

        const alreadyProcessed = book.pages.every(
          (p) =>
            p.leftHalfUrl &&
            p.rightHalfUrl &&
            p.rightTextColor &&
            (p.leftText || p.rightText),
        );

        if (alreadyProcessed) {
          console.log("Returning pre-processed pages from DB.");
          return res.json({ pages: book.pages });
        }

        // Otherwise: split, upload, color-pick, and store results
        const processedPages = [];

        for (const page of pages) {
          const { leftHalf, rightHalf } = await splitImageInHalf(page.imageUrl);
          const leftFileName = `books/${bookId}/pages/${page.id}_left.png`;
          const rightFileName = `books/${bookId}/pages/${page.id}_right.png`;

          const leftHalfUrl = await uploadBase64ToFirebase(
            leftHalf,
            leftFileName,
          );
          const rightHalfUrl = await uploadBase64ToFirebase(
            rightHalf,
            rightFileName,
          );

          const rightImg = await loadBase64Image(rightHalf);
          const rightTextColor = pickContrastingTextColor(
            rightImg,
            50,
            50,
            100,
            100,
          );

          const leftText = "";
          const rightText = page.content;

          processedPages.push({
            ...page,
            leftHalfUrl,
            rightHalfUrl,
            leftTextColor: "", // or computed
            rightTextColor,
            leftText,
            rightText,
          });
        }

        // ✅ Save updated pages back to DB
        await storage.updateBook(bookId, { pages: processedPages });

        res.json({ pages: processedPages });
      } catch (error) {
        console.error("prepareSplit error:", error);
        res.status(500).json({ message: "Failed to process pages" });
      }
    },
  );

  return httpServer;
}

//   app.post("/api/pdf/generate", async (req: Request, res: Response) => {
//      const { id, title, pages, coverUrl, backCoverUrl, storyPrompt } = req.body;
//       setLocation(`/pdf-editor/${id}`);
// }
