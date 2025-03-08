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
import admin from "firebase-admin";
import session from "express-session";
import multer from "multer";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import {
  trainCustomModel,
  generateStoryImages,
} from "./utils/trainAndGenerate";

import { fal } from "@fal-ai/client";

const DEBUG_LOGGING = process.env.DEBUG_LOGGING === "true";

// Extend Express Session type to include userId
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Initialize Firebase Admin SDK with credentials
try {
  // Check if app is already initialized
  if (admin.apps.length === 0) {
    // Create a service account object from environment variables
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.VITE_FIREBASE_PROJECT_ID || "kids-story-5eb1b",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY ? 
        process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      universe_domain: "googleapis.com"
    };

    // Initialize with explicit credentials
    admin.initializeApp({
      credential: process.env.FIREBASE_PRIVATE_KEY 
        ? admin.credential.cert(serviceAccount as admin.ServiceAccount)
        : admin.credential.applicationDefault(), // Fallback but will likely fail in Replit
      storageBucket: "kids-story-5eb1b.firebasestorage.app"
    });
    
    console.log("Firebase Admin SDK initialized successfully");
  }
} catch (err) {
  console.error("Firebase admin initialization error:", err);
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ message: "ID token is required" });
      }

      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Find or create user in your database
      let user = await storage.getUserByUid(uid);

      if (!user) {
        user = await storage.createUser({
          uid,
          email: decodedToken.email || "",
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
        });
      }

      // Set session data
      req.session!.userId = user.id;

      res.status(200).json({ message: "Authenticated successfully", user });
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(401).json({ message: "Authentication failed" });
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
      const userId = req.session?.userId || 1;

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
      // Use session userId if authenticated, otherwise use default
      const userId = req.session?.userId || 1;
      const characters = await storage.getCharactersByUserId(userId);
      res.status(200).json(characters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch characters", error });
    }
  });

  // Story routes with optional authentication
  app.post("/api/stories", async (req: Request, res: Response) => {
    try {
      // Use session userId if authenticated, otherwise use default
      const userId = req.session?.userId || 1;

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
      // Use session userId if authenticated, otherwise use default
      const userId = req.session?.userId || 1;
      const stories = await storage.getStoriesByUserId(userId);
      res.status(200).json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stories", error });
    }
  });

  // Book routes with optional authentication
  app.post("/api/books", async (req: Request, res: Response) => {
    try {
      // Use session userId if authenticated, otherwise use default
      const userId = req.session?.userId || 1;

      const validatedData = insertBookSchema.parse({
        ...req.body,
        userId,
      });

      const book = await storage.createBook(validatedData);
      res.status(201).json(book);
    } catch (error) {
      res.status(400).json({ message: "Invalid book data", error });
    }
  });

  app.get("/api/books", async (req: Request, res: Response) => {
    try {
      // Use session userId if authenticated, otherwise use default
      const userId = req.session?.userId || 1;
      const books = await storage.getBooksByUserId(userId);
      res.status(200).json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch books", error });
    }
  });

  // Order routes with optional authentication
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      // Use session userId if authenticated, otherwise use default
      const userId = req.session?.userId || 1;

      const validatedData = insertOrderSchema.parse({
        ...req.body,
        userId,
      });

      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data", error });
    }
  });

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
