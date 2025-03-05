import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertCharacterSchema, insertStorySchema, insertBookSchema, insertOrderSchema, shippingFormSchema } from "@shared/schema";
import { generatePDF } from "./utils/pdf";
import { authenticate } from "./middleware/auth";
// Import firebase but don't initialize with credentials for now
import admin from "firebase-admin";
import session from "express-session";

// Extend Express Session type to include userId
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Initialize Firebase Admin SDK with a simple configuration for development
try {
  admin.initializeApp();
} catch (err) {
  // App might already be initialized
  console.log("Firebase admin initialization:", err);
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
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

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session!.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Character routes
  app.post('/api/characters', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      
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

  app.get('/api/characters', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      const characters = await storage.getCharactersByUserId(userId);
      res.status(200).json(characters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch characters", error });
    }
  });

  // Story routes
  app.post('/api/stories', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      
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

  app.get('/api/stories', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      // Ensure userId is defined before passing to storage
      if (userId === undefined) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const stories = await storage.getStoriesByUserId(userId);
      res.status(200).json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stories", error });
    }
  });

  // Book routes
  app.post('/api/books', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      
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

  app.get('/api/books', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      // Ensure userId is defined before passing to storage
      if (userId === undefined) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const books = await storage.getBooksByUserId(userId);
      res.status(200).json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch books", error });
    }
  });

  // Order routes
  app.post('/api/orders', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      
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

  // PDF generation
  app.post('/api/pdf/generate', authenticate, async (req: Request, res: Response) => {
    try {
      const { title, pages } = req.body;
      
      const buffer = await generatePDF(title, pages);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}.pdf"`);
      
      res.send(buffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: "Failed to generate PDF", error });
    }
  });

  return httpServer;
}
