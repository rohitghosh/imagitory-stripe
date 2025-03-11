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

  // Configure session middleware with improved settings
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: true, // Changed to true to ensure session changes are always saved
      saveUninitialized: true, // Keep as true to ensure session is created for all visitors
      cookie: {
        secure: process.env.NODE_ENV === "production", // Only use secure cookies in production
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
        path: '/' // Ensure cookies apply to all paths
      },
      name: 'storyteller.sid', // Named session for better identification
      rolling: true // Resets the cookie expiration on every response
    })
  );
    
  // Middleware to ensure session is properly established for all routes
  app.use((req, res, next) => {
    // Force session initialization for all requests
    if (!req.session) {
      console.error('Session middleware failed to initialize session');
    } else if (DEBUG_LOGGING && req.url.startsWith('/api/') && req.url !== '/api/auth/login') {
      // Only log for API routes that aren't the login endpoint to avoid excessive logging
      console.log(`[Session Init] ${req.method} ${req.url} has session: ${!!req.session}, ID: ${req.sessionID}, userId: ${req.session.userId || 'none'}`);
    }
    next();
  });
  
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
          console.log(`[/api/auth/login] Token verified for user: ${decodedToken.email}`);
          console.log(`[/api/auth/login] Firebase UID: ${uid}`);
        }

        // Step 2: Find or create user in our storage
        if (DEBUG_LOGGING) {
          console.log(`[/api/auth/login] Finding user with UID: ${uid}`);
        }

        let user = await storage.getUserByUid(uid);

        if (!user) {
          if (DEBUG_LOGGING) {
            console.log(`[/api/auth/login] Creating new user for: ${decodedToken.email}`);
          }

          // Create a new user
          user = await storage.createUser({
            uid,
            email: decodedToken.email || "",
            displayName: decodedToken.name || decodedToken.email?.split("@")[0] || "User",
            photoURL: decodedToken.picture || "",
          });
          
          if (DEBUG_LOGGING) {
            console.log(`[/api/auth/login] New user created with ID: ${user.id}`);
          }
        } else if (DEBUG_LOGGING) {
          console.log(`[/api/auth/login] Found existing user with ID: ${user.id}`);
        }

        // Step 3: Store user ID in session
        if (!req.session) {
          console.error('[/api/auth/login] Session object not available');
          return res.status(500).json({ message: "Session initialization failed" });
        }
        
        if (DEBUG_LOGGING) {
          console.log('[/api/auth/login] Current session state before modification:', {
            sessionID: req.sessionID,
            sessionData: req.session
          });
        }
        
        // Set the userId directly on the session
        req.session.userId = String(user.id);
        
        if (DEBUG_LOGGING) {
          console.log('[/api/auth/login] Session after setting userId:', {
            userId: req.session.userId,
            sessionID: req.sessionID
          });
        }
        
        // Step 4: Save the session with a promise to ensure it completes
        try {
          await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
              if (err) {
                console.error('[/api/auth/login] Session save error:', err);
                reject(err);
              } else {
                if (DEBUG_LOGGING) {
                  console.log('[/api/auth/login] Session saved successfully');
                }
                resolve();
              }
            });
          });
        } catch (saveError) {
          console.error('[/api/auth/login] Failed to save session:', saveError);
          return res.status(500).json({ message: "Failed to save session" });
        }
        
        // Step 5: Double-check the session was properly saved
        if (DEBUG_LOGGING) {
          console.log('[/api/auth/login] Final session state:', {
            userId: req.session.userId,
            sessionID: req.sessionID,
            cookie: req.session.cookie
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

  // Character routes with improved authentication
  app.post("/api/characters", async (req: Request, res: Response) => {
    try {
      // Check authentication with detailed logging
      if (!req.session || !req.session.userId) {
        if (DEBUG_LOGGING) {
          console.log('[/api/characters POST] Authentication failed:', {
            hasSession: !!req.session,
            sessionID: req.sessionID
          });
        }
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.userId.toString();
      
      if (DEBUG_LOGGING) {
        console.log(`[/api/characters POST] User authenticated: ${userId}`);
        console.log('[/api/characters POST] Request body:', req.body);
      }

      const validatedData = insertCharacterSchema.parse({
        ...req.body,
        userId,
      });

      const character = await storage.createCharacter(validatedData);
      
      if (DEBUG_LOGGING) {
        console.log('[/api/characters POST] Character created:', character);
      }
      
      res.status(201).json(character);
    } catch (error: any) {
      console.error('[/api/characters POST] Error:', error);
      res.status(400).json({ 
        message: "Invalid character data", 
        error: error.errors || error.message || {} 
      });
    }
  });

  app.get("/api/characters", async (req: Request, res: Response) => {
    try {
      const { type } = req.query;
      
      if (DEBUG_LOGGING) {
        console.log(`[/api/characters GET] Query params:`, req.query);
      }

      let characters;

      if (type === "predefined") {
        if (DEBUG_LOGGING) {
          console.log('[/api/characters GET] Fetching predefined characters');
        }
        characters = await storage.getCharactersByType("predefined");
      } else {
        // Check authentication for custom characters
        if (!req.session || !req.session.userId) {
          if (DEBUG_LOGGING) {
            console.log('[/api/characters GET] Authentication failed for custom characters:', {
              hasSession: !!req.session,
              sessionID: req.sessionID
            });
          }
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const userId = req.session.userId.toString();
        
        if (DEBUG_LOGGING) {
          console.log(`[/api/characters GET] Fetching characters for user: ${userId}`);
        }
        
        characters = await storage.getCharactersByUserId(userId);
      }
      
      if (DEBUG_LOGGING) {
        console.log(`[/api/characters GET] Found ${characters.length} characters`);
      }

      res.status(200).json(characters);
    } catch (error: any) {
      console.error('[/api/characters GET] Error:', error);
      res.status(500).json({ 
        message: "Failed to fetch characters", 
        error: error.message || {} 
      });
    }
  });

  // Story routes with improved authentication
  app.post("/api/stories", async (req: Request, res: Response) => {
    try {
      // Check authentication with detailed logging
      if (!req.session || !req.session.userId) {
        if (DEBUG_LOGGING) {
          console.log('[/api/stories POST] Authentication failed:', {
            hasSession: !!req.session,
            sessionID: req.sessionID
          });
        }
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.userId.toString();
      
      if (DEBUG_LOGGING) {
        console.log(`[/api/stories POST] User authenticated: ${userId}`);
        console.log('[/api/stories POST] Request body:', req.body);
      }

      const validatedData = insertStorySchema.parse({
        ...req.body,
        userId,
      });

      const story = await storage.createStory(validatedData);
      
      if (DEBUG_LOGGING) {
        console.log('[/api/stories POST] Story created:', story);
      }
      
      res.status(201).json(story);
    } catch (error: any) {
      console.error('[/api/stories POST] Error:', error);
      res.status(400).json({ 
        message: "Invalid story data", 
        error: error.errors || error.message || {} 
      });
    }
  });

  app.get("/api/stories", async (req: Request, res: Response) => {
    try {
      const { type } = req.query;
      
      if (DEBUG_LOGGING) {
        console.log(`[/api/stories GET] Query params:`, req.query);
      }
      
      let stories;

      if (type === "predefined") {
        if (DEBUG_LOGGING) {
          console.log('[/api/stories GET] Fetching predefined stories');
        }
        
        stories = await storage.getStoriesByType("predefined");
        
        // Type safety fix for the groupedStories
        const groupedStories: Record<string, any[]> = {
          "3-5": [],
          "6-8": [],
          "9-12": []
        };
        
        stories.forEach(story => {
          // Use a safe fallback if ageGroup is not present
          const ageGroup = (story as any).ageGroup || "3-5";
          groupedStories[ageGroup].push(story);
        });
        
        if (DEBUG_LOGGING) {
          console.log('[/api/stories GET] Grouped predefined stories by age:', {
            total: stories.length,
            byAge: {
              "3-5": groupedStories["3-5"].length,
              "6-8": groupedStories["6-8"].length,
              "9-12": groupedStories["9-12"].length
            }
          });
        }

        return res.status(200).json(groupedStories);
      } else {
        // Check authentication for user's stories
        if (!req.session || !req.session.userId) {
          if (DEBUG_LOGGING) {
            console.log('[/api/stories GET] Authentication failed for user stories:', {
              hasSession: !!req.session,
              sessionID: req.sessionID
            });
          }
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const userId = req.session.userId.toString();
        
        if (DEBUG_LOGGING) {
          console.log(`[/api/stories GET] Fetching stories for user: ${userId}`);
        }
        
        stories = await storage.getStoriesByUserId(userId);
        
        if (DEBUG_LOGGING) {
          console.log(`[/api/stories GET] Found ${stories.length} stories for user ${userId}`);
        }
        
        res.status(200).json(stories);
      }
    } catch (error: any) {
      console.error("[/api/stories GET] Error:", error);
      res.status(500).json({ 
        message: "Failed to fetch stories", 
        error: error.message || {} 
      });
    }
  });
  // Book routes with authentication
  app.post("/api/books", async (req: Request, res: Response) => {
    try {
      // Check authentication with detailed logging
      if (!req.session || !req.session.userId) {
        if (DEBUG_LOGGING) {
          console.log('[/api/books POST] Authentication failed:', {
            hasSession: !!req.session,
            sessionID: req.sessionID
          });
        }
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.session.userId.toString();
      
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
        error: error.errors || error.message || {}
      });
    }
  });

  app.get("/api/books", async (req: Request, res: Response) => {
    try {
      // Check authentication with detailed logging
      if (!req.session || !req.session.userId) {
        if (DEBUG_LOGGING) {
          console.log('[/api/books GET] Authentication failed:', {
            hasSession: !!req.session,
            sessionID: req.sessionID
          });
        }
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.session.userId.toString();
      
      if (DEBUG_LOGGING) {
        console.log(`[/api/books GET] User authenticated: ${userId}`);
      }
      
      const books = await storage.getBooksByUserId(userId);
      
      if (DEBUG_LOGGING) {
        console.log(`[/api/books GET] Found ${books.length} books for user ${userId}`);
      }
      
      res.status(200).json(books);
    } catch (error: any) {
      console.error('[/api/books GET] Error:', error);
      res.status(500).json({ 
        message: "Failed to fetch books", 
        error: error.message || {}
      });
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
