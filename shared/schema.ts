// import { z } from "zod";

// const INTEREST_OPTIONS = [
//   "Reading",
//   "Sports",
//   "Music",
//   "Art",
//   "Science",
// ] as const;

// // --------------------
// // Firestore Data Schemas
// // --------------------

// // Users collection
// export const userSchema = z.object({
//   uid: z.string(),
//   email: z.string(),
//   displayName: z.string().optional(),
//   photoURL: z.string().optional(),
//   createdAt: z.date(),
// });
// export type User = z.infer<typeof userSchema>;

// // Characters collection
// export const characterSchema = z.object({
//   id: z.string(),
//   userId: z.string().optional(), // Not required for predefined characters
//   name: z.string(),
//   type: z.enum(["predefined", "main", "side"]),
//   age: z.number().optional(),
//   gender: z.enum(["boy", "girl", "other"]).optional(),
//   predefinedId: z.string().optional(),
//   description: z.string().optional(),
//   imageUrls: z.array(z.string()).optional(),
//   interests: z.array(z.enum(INTEREST_OPTIONS)).optional(),
//   relations: z
//     .array(
//       z.object({
//         primaryCharacterId: z.string(),
//         relation: z.string().min(1),
//       }),
//     )
//     .optional(),
//   createdAt: z.date(),
//   modelId: z.string().optional(),
//   toonUrl: z.string().url().optional(),
// });
// export type Character = z.infer<typeof characterSchema>;

// // Stories collection
// export const storySchema = z.object({
//   id: z.string(),
//   userId: z.string(),
//   title: z.string(),
//   type: z.enum(["predefined", "custom"]),
//   predefinedId: z.string().optional(),
//   genre: z.string().optional(),
//   instructions: z.string().optional(),
//   rhyming: z.boolean().optional(),
//   moral: z.string().optional(),
//   theme: z.string().optional(),
//   createdAt: z.date(),
// });
// export type Story = z.infer<typeof storySchema>;

// // Books collection
// export const bookSchema = z.object({
//   id: z.string(),
//   userId: z.string(),
//   characterId: z.string(),
//   pages: z
//     .array(
//       z.object({
//         id: z.number().optional(),
//         imageUrl: z.string().nullable().optional(),
//         imageUrls: z.array(z.string()).optional(), // NEW
//         currentImageIndex: z.number().optional(), // NEW;
//         content: z.string().nullable().optional(),
//         prompt: z.string().optional(),
//         loraScale: z.number().optional(),
//         controlLoraStrength: z.number().optional(),
//         seed: z.number().optional(),
//       }),
//     )
//     .optional(),
//   createdAt: z.date(),
//   avatarLora: z.number().nullable().optional(),
//   avatarFinalized: z.boolean().default(false),
//   sceneTexts: z.array(z.string()).optional(),
//   imagePrompts: z.array(z.string()).optional(),
//   modelId: z.string().optional(),
//   storyId: z.string().nullable().optional(), // allow null | string
//   title: z.string(),
//   coverUrl: z.string().nullable().optional(),
//   backCoverUrl: z.string().nullable().optional(),
//   stylePreference: z.string().optional(),
//   avatarUrl: z.string().nullable().optional(),
//   skeletonJobId: z.string().optional(),
//   imagesJobId: z.string().optional(),
// });
// export type Book = z.infer<typeof bookSchema>;

// // Orders collection
// export const orderSchema = z.object({
//   id: z.string(),
//   userId: z.string(),
//   bookId: z.string(),
//   firstName: z.string(),
//   lastName: z.string(),
//   address: z.string(),
//   city: z.string(),
//   state: z.string(),
//   zip: z.string(),
//   country: z.string(),
//   status: z.enum(["pending", "shipped", "completed", "cancelled"]).optional(),
//   createdAt: z.date(),
// });
// export type Order = z.infer<typeof orderSchema>;

// // --------------------
// // Frontend Form Schemas (Zod)
// // --------------------
// export const insertUserSchema = userSchema.pick({
//   uid: true,
//   email: true,
//   displayName: true,
//   photoURL: true,
// });

// export const insertCharacterSchema = characterSchema
//   .omit({ id: true, createdAt: true })
//   .extend({ storyId: z.string().optional() });

// export const insertStorySchema = storySchema.omit({
//   id: true,
//   createdAt: true,
// });

// export const insertBookSchema = bookSchema
//   .omit({ id: true, createdAt: true, sceneTexts: true, imagePrompts: true })
//   .partial({ storyId: true, coverUrl: true, backCoverUrl: true, pages: true });

// export const insertOrderSchema = orderSchema
//   .omit({ id: true, createdAt: true })
//   .partial({ status: true });

// export const shippingFormSchema = z.object({
//   firstName: z.string().min(1, "First name is required"),
//   lastName: z.string().min(1, "Last name is required"),
//   address: z.string().min(1, "Address is required"),
//   city: z.string().min(1, "City is required"),
//   state: z.string().min(1, "State is required"),
//   zip: z.string().min(1, "Zip code is required"),
//   country: z.string().min(1, "Country is required"),
// });

// export const updateBookSchema = z
//   .object({
//     // the 4 you were already sending
//     title: z.string().optional(),
//     coverUrl: z.string().nullable().optional(),
//     backCoverUrl: z.string().nullable().optional(),

//     // plus any other fields you might patch in future…
//     avatarFinalized: z.boolean().optional(),
//     avatarUrl: z.string().nullable().optional(),
//     avatarLora: z.number().optional(),
//     storyId: z.string().optional(),
//     modelId: z.string().optional(),
//     sceneTexts: z.array(z.string()).optional(),
//     imagePrompts: z.array(z.string()).optional(),
//     stylePreference: z.string().optional(),
//     skeletonJobId: z.string().optional(),
//     imagesJobId: z.string().optional(),
//     pages: z
//       .array(
//         z
//           .object({
//             id: z.number().optional(),
//             imageUrl: z.string().nullable().optional(),
//             content: z.string().nullable().optional(),
//             prompt: z.string().optional(),
//             loraScale: z.number().optional(),
//             controlLoraStrength: z.number().optional(),
//             seed: z.number().optional(),
//           })
//           .passthrough(),
//       )
//       .optional(),
//   })
//   .partial() // make every key optional
//   .passthrough();

import { z } from "zod";

const INTEREST_OPTIONS = [
  "Reading",
  "Sports",
  "Music",
  "Art",
  "Science",
] as const;

// --------------------
// Firestore Data Schemas
// --------------------

// Users collection
export const userSchema = z.object({
  uid: z.string(),
  email: z.string(),
  displayName: z.string().optional(),
  photoURL: z.string().optional(),
  createdAt: z.date(),
});
export type User = z.infer<typeof userSchema>;

// Characters collection
export const characterSchema = z.object({
  id: z.string(),
  userId: z.string().optional(), // Not required for predefined characters
  name: z.string(),
  type: z.enum(["predefined", "main", "side"]),
  age: z.number().optional(),
  gender: z.enum(["boy", "girl", "other"]).optional(),
  predefinedId: z.string().optional(),
  description: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  interests: z.array(z.enum(INTEREST_OPTIONS)).optional(),
  relations: z
    .array(
      z.object({
        primaryCharacterId: z.string(),
        relation: z.string().min(1),
      }),
    )
    .optional(),
  createdAt: z.date(),
  modelId: z.string().optional(),
  toonUrl: z.string().url().optional(), // Legacy field for backwards compatibility
  toonUrls: z.record(z.string(), z.string().url()).optional(), // New field: animationStyle -> toonUrl mapping
});
export type Character = z.infer<typeof characterSchema>;

// Stories collection
export const storySchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  type: z.enum(["predefined", "custom"]),
  predefinedId: z.string().optional(),
  genre: z.string().optional(),
  instructions: z.string().optional(),
  rhyming: z.boolean().optional(),
  moral: z.string().optional(),
  theme: z.string().optional(),
  createdAt: z.date(),
});
export type Story = z.infer<typeof storySchema>;

// Books collection
export const bookSchema = z.object({
  id: z.string(),
  userId: z.string(),
  characterId: z.string(),
  pages: z
    .array(
      z.object({
        id: z.number().optional(),
        imageUrl: z.string().nullable().optional(),
        imageUrls: z.array(z.string()).optional(), // NEW
        currentImageIndex: z.number().optional(), // NEW;
        content: z
          .union([z.string(), z.array(z.string())])
          .nullable()
          .optional(),
        leftText: z
          .union([z.string(), z.array(z.string())])
          .nullable()
          .optional(),
        rightText: z
          .union([z.string(), z.array(z.string())])
          .nullable()
          .optional(),
        prompt: z.string().optional(),
        loraScale: z.number().optional(),
        controlLoraStrength: z.number().optional(),
        seed: z.number().optional(),
      }),
    )
    .optional(),
  createdAt: z.date(),
  avatarLora: z.number().nullable().optional(),
  avatarFinalized: z.boolean().default(false),
  sceneTexts: z.array(z.string()).optional(),
  imagePrompts: z.array(z.string()).optional(),
  modelId: z.string().optional(),
  storyId: z.string().nullable().optional(), // allow null | string
  title: z.string(),
  coverUrl: z.string().nullable().optional(),
  backCoverUrl: z.string().nullable().optional(),
  stylePreference: z.string().optional(),
  avatarUrl: z.string().nullable().optional(),
  skeletonJobId: z.string().optional(),
  imagesJobId: z.string().nullable().optional(), // Allow null
  imageJobs: z.record(z.string(), z.any()).optional(), // New image generation jobs
});
export type Book = z.infer<typeof bookSchema>;

// Orders collection
export const orderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bookId: z.string(),
  orderType: z.enum(["book_creation", "shipping"]).default("book_creation"),
  firstName: z.string(),
  lastName: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
  status: z
    .enum([
      "pending",
      "payment_pending",
      "paid",
      "shipped",
      "completed",
      "cancelled",
    ])
    .optional(),
  paymentId: z.string().optional(),
  paymentStatus: z.enum(["pending", "success", "failed"]).optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  createdAt: z.date(),
});
export type Order = z.infer<typeof orderSchema>;

// --------------------
// Frontend Form Schemas (Zod)
// --------------------
export const insertUserSchema = userSchema.pick({
  uid: true,
  email: true,
  displayName: true,
  photoURL: true,
});

export const insertCharacterSchema = characterSchema
  .omit({ id: true, createdAt: true })
  .extend({ storyId: z.string().optional() });

export const insertStorySchema = storySchema.omit({
  id: true,
  createdAt: true,
});

export const insertBookSchema = bookSchema
  .omit({ id: true, createdAt: true, sceneTexts: true, imagePrompts: true })
  .partial({ storyId: true, coverUrl: true, backCoverUrl: true, pages: true });

export const insertOrderSchema = orderSchema
  .omit({ id: true, createdAt: true })
  .partial({
    orderType: true,
    status: true,
    paymentId: true,
    paymentStatus: true,
    amount: true,
    currency: true,
    razorpayOrderId: true,
    razorpayPaymentId: true,
    razorpaySignature: true,
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

export const updateBookSchema = z
  .object({
    // the 4 you were already sending
    title: z.string().optional(),
    coverUrl: z.string().nullable().optional(),
    backCoverUrl: z.string().nullable().optional(),

    // plus any other fields you might patch in future…
    avatarFinalized: z.boolean().optional(),
    avatarUrl: z.string().nullable().optional(),
    avatarLora: z.number().optional(),
    storyId: z.string().optional(),
    modelId: z.string().optional(),
    sceneTexts: z.array(z.string()).optional(),
    imagePrompts: z.array(z.string()).optional(),
    stylePreference: z.string().optional(),
    skeletonJobId: z.string().optional(),
    imagesJobId: z.string().nullable().optional(), // Allow null
    pages: z
      .array(
        z
          .object({
            id: z.number().optional(),
            imageUrl: z.string().nullable().optional(),
            // Accept both string and array for content and text fields
            content: z
              .union([z.string(), z.array(z.string())])
              .nullable()
              .optional(),
            leftText: z
              .union([z.string(), z.array(z.string())])
              .nullable()
              .optional(),
            rightText: z
              .union([z.string(), z.array(z.string())])
              .nullable()
              .optional(),
            prompt: z.string().optional(),
            loraScale: z.number().optional(),
            controlLoraStrength: z.number().optional(),
            seed: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .partial() // make every key optional
  .passthrough();
