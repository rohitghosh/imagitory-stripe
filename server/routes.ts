import type { Express, Request, Response, NextFunction } from "express";
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
// import { authenticate } from "./middleware/auth";
// Import firebase but don't initialize with credentials for now
import session from "express-session";
import multer from "multer";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import {
  trainCustomModel,
  generateStoryImages,
} from "./utils/trainAndGenerate";
import admin from "./firebaseAdmin";

import { fal } from "@fal-ai/client";

const DEBUG_LOGGING = process.env.DEBUG_LOGGING === "true";

// Extend Express Session type to include userId
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: true, // Changed to true to ensure session is created
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
      },
      name: 'storyteller.sid' // Named session for better identification
    })
  );
  
  // Debug middleware to log session information on every request
  if (DEBUG_LOGGING) {
    app.use((req, res, next) => {
      if (req.url.startsWith('/api/')) {
        console.log('[Session Debug] Request to:', req.url, {
          hasSession: !!req.session,
          sessionID: req.sessionID,
          userId: req.session?.userId 
        });
      }
      next();
    });
  }

  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: NextFunction) => {
    if (DEBUG_LOGGING) {
      console.log('[authenticate] Session check:', { 
        hasSession: !!req.session,
        sessionID: req.sessionID,
        userId: req.session?.userId,
        url: req.url
      });
    }
    
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (DEBUG_LOGGING) {
      console.log(`[authenticate] User authorized: ${req.session.userId}`);
    }
    
    next();
  };

  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const DEBUG_LOGGING = process.env.DEBUG_LOGGING === "true";
      const { idToken } = req.body;

      if (DEBUG_LOGGING) {
        console.log("[/api/auth/login] Received authentication request");
      }

      if (!idToken) {
        if (DEBUG_LOGGING) {
          console.error("[/api/auth/login] Missing ID token in request");
        }
        return res.status(400).json({ message: "ID token is required" });
      }

      try {
        // Verify the ID token
        if (DEBUG_LOGGING) {
          console.log("[/api/auth/login] Verifying Firebase ID token");
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        if (DEBUG_LOGGING) {
          console.log(
            `[/api/auth/login] Token verified for user: ${decodedToken.email}`,
          );
        }

        // Find or create user in your database
        if (DEBUG_LOGGING) {
          console.log(`[/api/auth/login] Looking up user with UID: ${uid}`);
        }

        let user = await storage.getUserByUid(uid);

        if (!user) {
          if (DEBUG_LOGGING) {
            console.log(
              `[/api/auth/login] Creating new user for: ${decodedToken.email}`,
            );
          }

          user = await storage.createUser({
            uid,
            email: decodedToken.email || "",
            displayName:
              decodedToken.name || decodedToken.email?.split("@")[0] || "User",
            photoURL: decodedToken.picture || "",
          });

          if (DEBUG_LOGGING) {
            console.log(`[/api/auth/login] User created with ID: ${user.id}`);
          }
        } else if (DEBUG_LOGGING) {
          console.log(
            `[/api/auth/login] Found existing user with ID: ${user.id}`,
          );
        }

        // Set session data
        if (DEBUG_LOGGING) {
          console.log('[/api/auth/login] User data:', {
            id: user.id,
            uid: user.uid,
            email: user.email,
          });
        }

        // Make sure to store userId as string
        req.session!.userId = String(user.id);

        // Debug - before save
        if (DEBUG_LOGGING) {
          console.log('[/api/auth/login] Session before save:', {
            userId: req.session!.userId,
            sessionID: req.sessionID
          });
        }
        
        // Save the session explicitly to ensure it's stored
        await new Promise<void>((resolve, reject) => {
          req.session!.save((err) => {
            if (err) {
              console.error('[/api/auth/login] Error saving session:', err);
              reject(err);
            } else {
              if (DEBUG_LOGGING) {
                console.log(
                  `[/api/auth/login] Session saved successfully for user ID: ${req.session!.userId}, Session ID: ${req.sessionID}`,
                );
              }
              resolve();
            }
          });
        });

        // Debug - after save to verify session data
        if (DEBUG_LOGGING) {
          console.log('[/api/auth/login] Session after save:', {
            userId: req.session!.userId,
            sessionID: req.sessionID
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
  // New Endpoint: Train Custom Model
  // This endpoint uses multer to capture the kidImages from the request.
  app.post("/api/trainModel", async (req: Request, res: Response) => {
    try {
      if (DEBUG_LOGGING)
        console.log("[/api/trainModel] Received training request:", req.body);
      const { imageUrls, captions, modelName } = req.body;
      if (!imageUrls || !captions) {
        throw new Error("imageUrls and captions are required.");
      }
      // Use the official fal.ai client API to train the model.
      const trainingResult = await trainCustomModel(
        imageUrls,
        captions,
        modelName || "kids_custom_model",
      );
      if (DEBUG_LOGGING)
        console.log(
          "[/api/trainModel] Training initiated. JobId from fal.ai:",
          trainingResult,
        );
      // Polling is done internally by our trainCustomModel via fal.subscribe.
      // Here we assume trainCustomModel returns { modelId, requestId } once training is complete.
      const { modelId: trainedModelId, requestId } = trainingResult;
      if (DEBUG_LOGGING) {
        console.log(
          "[/api/trainModel] Training completed. ModelId:",
          trainedModelId,
          "RequestId:",
          requestId,
        );
      }
      res.json({ modelId: trainedModelId, requestId });
    } catch (error: any) {
      if (DEBUG_LOGGING)
        console.error("[/api/trainModel] Training error:", error);
      res.status(500).json({ error: error.message || "Training failed" });
    }
  });

  // New Endpoint: Generate Story
  // Expects: kidName, modelId, baseStoryPrompt, and moral in the request body.
  // New Endpoint: Generate Story
  // Expects kidName, modelId, baseStoryPrompt, and moral in the request body.
  app.post("/api/generateStory", async (req: Request, res: Response) => {
    try {
      const { kidName, modelId, baseStoryPrompt, moral } = req.body;
      if (DEBUG_LOGGING)
        console.log("[/api/generateStory] Request body:", {
          kidName,
          modelId,
          baseStoryPrompt,
          moral,
        });
      if (!kidName || !modelId || !baseStoryPrompt || !moral) {
        throw new Error(
          "kidName, modelId, baseStoryPrompt, and moral are required.",
        );
      }
      const { images, sceneTexts } = await generateStoryImages(
        modelId,
        kidName,
        baseStoryPrompt,
        moral,
      );
      if (DEBUG_LOGGING) {
        console.log("[/api/generateStory] Generated images and scene texts:", {
          images,
          sceneTexts,
        });
      }
      res.json({
        cover: images[0],
        pages: images.slice(1),
        sceneTexts,
      });
    } catch (error: any) {
      if (DEBUG_LOGGING)
        console.error("[/api/generateStory] Story generation error:", error);
      res
        .status(500)
        .json({ error: error.message || "Story generation failed" });
    }
  });

  // Character routes with optional authentication
  app.post("/api/characters", async (req: Request, res: Response) => {
    try {
      // Use session userId if authenticated, otherwise use default
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.session.userId.toString();

      const validatedData = insertCharacterSchema.parse({
        ...req.body,
        userId,
      });

      const character = await storage.createCharacter(validatedData);
      res.status(201).json(character);
    } catch (error) {
      res.status(400).json({ message: "Invalid character data", error });
    }
  });

  app.get("/api/characters", async (req: Request, res: Response) => {
    try {
      const { type } = req.query;

      let characters;

      if (type === "predefined") {
        characters = await storage.getCharactersByType("predefined");
      } else {
        if (!req.session || !req.session.userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.session.userId.toString();
        characters = await storage.getCharactersByUserId(userId);
      }

      res.status(200).json(characters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch characters", error });
    }
  });

  // Story routes with optional authentication
  app.post("/api/stories", async (req: Request, res: Response) => {
    try {
      // Use session userId if authenticated, otherwise use default
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.session.userId.toString();

      const validatedData = insertStorySchema.parse({
        ...req.body,
        userId,
      });

      const story = await storage.createStory(validatedData);
      res.status(201).json(story);
    } catch (error) {
      res.status(400).json({ message: "Invalid story data", error });
    }
  });

  app.get("/api/stories", async (req: Request, res: Response) => {
    try {
      const { type } = req.query;
      let stories;

      if (type === "predefined") {
        stories = await storage.getStoriesByType("predefined");

        const groupedStories = stories.reduce(
          (acc, story) => {
            const ageGroup = story.ageGroup || "3-5";
            if (!acc[ageGroup]) acc[ageGroup] = [];
            acc[ageGroup].push(story);
            return acc;
          },
          { "3-5": [], "6-8": [], "9-12": [] },
        );

        return res.status(200).json(groupedStories);
      } else {
        if (!req.session || !req.session.userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.session.userId.toString();
        stories = await storage.getStoriesByUserId(userId);
        res.status(200).json(stories);
      }
    } catch (error) {
      console.error("[/api/stories] error:", error);
      res.status(500).json({ message: "Failed to fetch stories", error });
    }
  });
  // Book routes with optional authentication
  app.post("/api/books", async (req: Request, res: Response) => {
    try {
      // Use session userId if authenticated, otherwise use default
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.session.userId.toString();
      console.log("[/api/books] Received new book data:", {
        ...req.body,
        userId,
      });

      const validatedData = insertBookSchema.parse({
        ...req.body,
        userId,
      });

      const book = await storage.createBook(validatedData);
      console.log("[/api/books] Book created successfully:", book);

      res.status(201).json(book);
    } catch (error) {
      console.error("[/api/books] Error creating book:", error);
      res.status(400).json({ message: "Invalid book data", error });
    }
  });

  app.get("/api/books", async (req: Request, res: Response) => {
    try {
      // Use session userId if authenticated, otherwise use default
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.session.userId.toString();
      const books = await storage.getBooksByUserId(userId);
      res.status(200).json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch books", error });
    }
  });

  app.get("/api/books/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log("routes.ts - GET /api/books/:id called with id:", id);
    try {
      const book = await storage.getBookById(id);
      if (!book) {
        console.log("routes.ts - Book not found for id:", id);
        return res.status(404).json({ error: "Book not found" });
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
  });

  // Order routes with optional authentication
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session || !req.session.userId) {
        if (DEBUG_LOGGING) {
          console.log('[/api/orders POST] No auth session:', { 
            hasSession: !!req.session, 
            sessionID: req.sessionID 
          });
        }
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Use session userId if authenticated
      const userId = req.session.userId.toString();
      
      if (DEBUG_LOGGING) {
        console.log('[/api/orders POST] Auth validated, userId:', userId);
        console.log('[/api/orders POST] Request body:', req.body);
      }

      const validatedData = insertOrderSchema.parse({
        ...req.body,
        userId,
      });

      const order = await storage.createOrder(validatedData);
      
      if (DEBUG_LOGGING) {
        console.log('[/api/orders POST] Order created:', order);
      }
      
      res.status(201).json(order);
    } catch (error: any) {
      console.error('[/api/orders POST] Error:', error);
      res.status(400).json({ 
        message: "Invalid order data", 
        error: error.errors || error.message || {} 
      });
    }
  });

  // app.get("/api/orders", async (req: Request, res: Response) => {
  //   try {
  //     // Use session userId if authenticated; default to "1" if not (convert to string)
  //       if (!req.session || !req.session.userId) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }
  // const userId = req.session.userId.toString();
  //     const orders = await storage.getOrdersByUserId(userId);
  //     res.status(200).json(orders);
  //   } catch (error) {
  //     res.status(500).json({ message: "Failed to fetch orders", error });
  //   }
  // });

  // PDF generation - no authentication required
  app.post("/api/pdf/generate", async (req: Request, res: Response) => {
    try {
      const { title, pages } = req.body;

      const buffer = await generatePDF(title, pages);

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

  return httpServer;
}
