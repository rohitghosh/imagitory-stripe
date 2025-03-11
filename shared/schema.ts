import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'predefined' or 'custom'
  age: integer("age"),
  gender: text("gender"),
  predefinedId: text("predefined_id"), // Only for predefined characters
  description: text("description"),
  imageUrls: text("image_urls").array(), // For custom characters
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'predefined' or 'custom'
  predefinedId: text("predefined_id"), // Only for predefined stories
  genre: text("genre"),
  instructions: text("instructions"),
  elements: text("elements").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  characterId: text("character_id").notNull(),
  storyId: text("story_id").notNull(),
  title: text("title").notNull(),
  pages: jsonb("pages").notNull(), // Array of { imageUrl, content }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bookId: text("book_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  country: text("country").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
});
export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
});
export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
});
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  status: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Order = typeof orders.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Additional schemas for frontend forms
export const customCharacterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z
    .number()
    .min(1, "Age must be at least 1")
    .max(15, "Age must be at most 15")
    .optional(),
  gender: z.enum(["boy", "girl", "other"]),
  imageUrls: z
    .array(z.string())
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images allowed"),
});

export const customStorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  genre: z.string().min(1, "Genre is required"),
  instructions: z.string().min(1, "Instructions are required"),
  elements: z.array(z.string()),
});

export const shippingFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
});
