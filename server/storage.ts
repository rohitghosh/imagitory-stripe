// // storage.ts (Modified for Firestore-based storage)
// import {
//   type User,
//   type Character,
//   type Story,
//   type Book,
//   type Order,
//   type InsertUser,
//   type InsertCharacter,
//   type InsertStory,
//   type InsertBook,
//   type InsertOrder,
// } from "@shared/schema";
// import admin from "./firebaseAdmin";
// import { getFirestore } from "firebase-admin/firestore"; // [MODIFIED FOR FIRESTORE]

// // Explicitly initialize Firebase app (if not already done)
// if (!admin.apps.length) {
//   throw new Error("Firebase app initialization failed.");
// }
// // Initialize Firestore (firebase-admin should be already configured)
// const db = getFirestore();

// export interface IStorage {
//   // User operations
//   getUser(id: string): Promise<User | undefined>;
//   getUserByUid(uid: string): Promise<User | undefined>;
//   createUser(user: InsertUser): Promise<User>;

//   // Character operations
//   getCharacter(id: string): Promise<Character | undefined>;
//   getCharactersByUserId(userId: string): Promise<Character[]>;
//   createCharacter(character: InsertCharacter): Promise<Character>;

//   // Story operations (for predefined/custom stories)
//   getStory(id: string): Promise<Story | undefined>;
//   getStoriesByUserId(userId: string): Promise<Story[]>;
//   createStory(story: InsertStory): Promise<Story>;

//   // Book operations (generated books that reference a character and a story)
//   getBook(id: string): Promise<Book | undefined>;
//   getBooksByUserId(userId: string): Promise<Book[]>;
//   createBook(book: InsertBook): Promise<Book>;

//   // Order operations
//   getOrder(id: string): Promise<Order | undefined>;
//   getOrdersByUserId(userId: string): Promise<Order[]>;
//   createOrder(order: InsertOrder): Promise<Order>;
// }

// export class FirestoreStorage implements IStorage {
//   // ---------- User operations -----------
//   async getUser(id: string): Promise<User | undefined> {
//     const doc = await db.collection("users").doc(id).get();
//     return doc.exists ? ({ id: doc.id, ...doc.data() } as User) : undefined;
//   }
//   async getUserByUid(uid: string): Promise<User | undefined> {
//     const snapshot = await db.collection("users").where("uid", "==", uid).get();
//     if (snapshot.empty) return undefined;
//     const doc = snapshot.docs[0];
//     return { id: doc.id, ...doc.data() } as User;
//   }
//   async createUser(insertUser: InsertUser): Promise<User> {
//     const data = {
//       ...insertUser,
//       createdAt: new Date().toISOString(),
//       displayName: insertUser.displayName || null,
//       photoURL: insertUser.photoURL || null,
//     };
//     const docRef = await db.collection("users").add(data);
//     return { id: docRef.id, ...data } as User;
//   }
//   // ---------- Character operations -----------
//   async getCharacter(id: string): Promise<Character | undefined> {
//     const doc = await db.collection("characters").doc(id).get();
//     return doc.exists
//       ? ({ id: doc.id, ...doc.data() } as Character)
//       : undefined;
//   }

//   async updateCharacter(
//     id: string,
//     updatedData: any,
//   ): Promise<Character | null> {
//     const characterRef = db.collection("characters").doc(id);
//     const docSnapshot = await characterRef.get();
//     if (!docSnapshot.exists) {
//       return null;
//     }
//     await characterRef.update(updatedData);
//     return { id, ...updatedData } as Character;
//   }

//   async getCharactersByUserId(userId: string): Promise<Character[]> {
//     const snapshot = await db
//       .collection("characters")
//       .where("userId", "==", userId)
//       .get();
//     const results: Character[] = [];
//     snapshot.forEach((doc) =>
//       results.push({ id: doc.id, ...doc.data() } as Character),
//     );
//     return results;
//   }
//   async getCharactersByType(type: string): Promise<Character[]> {
//     const snapshot = await db
//       .collection("characters")
//       .where("type", "==", type)
//       .get();
//     const results: Character[] = [];
//     snapshot.forEach((doc) =>
//       results.push({ id: doc.id, ...doc.data() } as Character),
//     );
//     return results;
//   }
//   async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
//     const data = {
//       ...insertCharacter,
//       createdAt: new Date().toISOString(),
//       age: insertCharacter.age || null,
//       gender: insertCharacter.gender || null,
//       predefinedId: insertCharacter.predefinedId || null,
//       description: insertCharacter.description || null,
//       imageUrls: insertCharacter.imageUrls || [],
//       type: insertCharacter.type || "custom",
//     };
//     const docRef = await db.collection("characters").add(data);
//     return { id: docRef.id, ...data } as Character;
//   }
//   // ---------- Story operations -----------
//   async getStory(id: string): Promise<Story | undefined> {
//     const doc = await db.collection("stories").doc(id).get();
//     return doc.exists ? ({ id: doc.id, ...doc.data() } as Story) : undefined;
//   }
//   async getStoriesByUserId(userId: string): Promise<Story[]> {
//     const snapshot = await db
//       .collection("stories")
//       .where("userId", "==", userId)
//       .get();
//     const results: Story[] = [];
//     snapshot.forEach((doc) =>
//       results.push({ id: doc.id, ...doc.data() } as Story),
//     );
//     return results;
//   }
//   async getStoriesByType(type: string): Promise<Story[]> {
//     const snapshot = await db
//       .collection("stories")
//       .where("type", "==", type)
//       .get();
//     const results: Story[] = [];
//     snapshot.forEach((doc) =>
//       results.push({ id: doc.id, ...doc.data() } as Story),
//     );
//     return results;
//   }

//   async createStory(insertStory: InsertStory): Promise<Story> {
//     const data = {
//       ...insertStory,
//       createdAt: new Date().toISOString(),
//       predefinedId: insertStory.predefinedId || null,
//       genre: insertStory.genre || null,
//       instructions: insertStory.instructions || null,
//       elements: insertStory.elements || null,
//       type: insertStory.type || "custom",
//       rhyming: insertStory.rhyming || false,
//       theme: insertStory.theme || null,
//       moral: insertStory.moral || "",
//     };
//     const docRef = await db.collection("stories").add(data);
//     return { id: docRef.id, ...data } as Story;
//   }
//   // ---------- Book operations -----------
//   async getBook(id: string): Promise<Book | undefined> {
//     const doc = await db.collection("books").doc(id).get();
//     return doc.exists ? ({ id: doc.id, ...doc.data() } as Book) : undefined;
//   }
//   async getBooksByUserId(userId: string): Promise<Book[]> {
//     const snapshot = await db
//       .collection("books")
//       .where("userId", "==", userId)
//       .get();
//     const results: Book[] = [];
//     snapshot.forEach((doc) =>
//       results.push({ id: doc.id, ...doc.data() } as Book),
//     );
//     return results;
//   }
//   async createBook(insertBook: InsertBook): Promise<Book> {
//     const data = {
//       ...insertBook,
//       createdAt: new Date().toISOString(),
//     };
//     const docRef = await db.collection("books").add(data);
//     return { id: docRef.id, ...data } as Book;
//   }
//   async getBookById(id: string): Promise<Book | null> {
//     console.log("storage.ts - getBookById called with id:", id);
//     try {
//       const bookDoc = await db.collection("books").doc(id).get();
//       if (!bookDoc.exists) {
//         console.log("storage.ts - Book not found for id:", id);
//         return null;
//       }
//       const bookData = bookDoc.data();
//       console.log("storage.ts - Book found for id:", id, bookData);
//       return bookData;
//     } catch (error) {
//       console.error("storage.ts - Error fetching book with id:", id, error);
//       throw error;
//     }
//   }
//   async updateBook(id: string, updatedData: any): Promise<Book | null> {
//     console.log("storage.ts - updateBook called with id:", id);
//     const bookRef = db.collection("books").doc(id);
//     const doc = await bookRef.get();
//     if (!doc.exists) {
//       return null;
//     }
//     await bookRef.update(updatedData);
//     return { id, ...updatedData };
//   }

//   async updateBookPageContent(
//     bookId: string,
//     pageId: number,
//     newContent: string,
//   ): Promise<Book | null> {
//     const bookRef = db.collection("books").doc(bookId);

//     await db.runTransaction(async (tx) => {
//       const snap = await tx.get(bookRef);
//       if (!snap.exists) {
//         console.log(`return null reason no-document bookId ${bookId}`);
//         return null;
//       }

//       const data = snap.data() as Book;
//       if (!Array.isArray(data.pages)) {
//         console.log(`return null reason pages-not-array bookId ${bookId}`);
//         return null;
//       }

//       const pages = [...data.pages]; // clone
//       const idx = pages.findIndex((p) => p.scene_number === pageId - 1);
//       if (idx === -1) {
//         console.log(`return null reason pageId-not-found ${pageId}`);
//         return null;
//       }

//       pages[idx] = { ...pages[idx], content: newContent }; // mutate
//       tx.update(bookRef, { pages }); // write whole array
//     });

//     const after = await bookRef.get();
//     return { id: bookId, ...(after.data() as Book) };
//   }

//   // ---------- Order operations -----------
//   async getOrder(id: string): Promise<Order | undefined> {
//     const doc = await db.collection("orders").doc(id).get();
//     return doc.exists ? ({ id: doc.id, ...doc.data() } as Order) : undefined;
//   }
//   async getOrdersByUserId(userId: string): Promise<Order[]> {
//     const snapshot = await db
//       .collection("orders")
//       .where("userId", "==", userId)
//       .get();
//     const results: Order[] = [];
//     snapshot.forEach((doc) =>
//       results.push({ id: doc.id, ...doc.data() } as Order),
//     );
//     return results;
//   }
//   async createOrder(insertOrder: InsertOrder): Promise<Order> {
//     const data = {
//       ...insertOrder,
//       createdAt: new Date().toISOString(),
//       status: "pending",
//     };
//     const docRef = await db.collection("orders").add(data);
//     return { id: docRef.id, ...data } as Order;
//   }
// }

// export const storage = new FirestoreStorage();
// storage.ts (Modified for Firestore-based storage)
import {
  type User,
  type Character,
  type Story,
  type Book,
  type Order,
  type InsertUser,
  type InsertCharacter,
  type InsertStory,
  type InsertBook,
  type InsertOrder,
} from "@shared/schema";
import admin from "./firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore"; // [MODIFIED FOR FIRESTORE]

// Explicitly initialize Firebase app (if not already done)
if (!admin.apps.length) {
  throw new Error("Firebase app initialization failed.");
}
// Initialize Firestore (firebase-admin should be already configured)
const db = getFirestore();

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Character operations
  getCharacter(id: string): Promise<Character | undefined>;
  getCharactersByUserId(userId: string): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;

  // Story operations (for predefined/custom stories)
  getStory(id: string): Promise<Story | undefined>;
  getStoriesByUserId(userId: string): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;

  // Book operations (generated books that reference a character and a story)
  getBook(id: string): Promise<Book | undefined>;
  getBooksByUserId(userId: string): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;

  // Order operations
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
}

export class FirestoreStorage implements IStorage {
  // ---------- User operations -----------
  async getUser(id: string): Promise<User | undefined> {
    const doc = await db.collection("users").doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as User) : undefined;
  }
  async getUserByUid(uid: string): Promise<User | undefined> {
    const snapshot = await db.collection("users").where("uid", "==", uid).get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const data = {
      ...insertUser,
      createdAt: new Date().toISOString(),
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null,
    };
    const docRef = await db.collection("users").add(data);
    return { id: docRef.id, ...data } as User;
  }
  // ---------- Character operations -----------
  async getCharacter(id: string): Promise<Character | undefined> {
    const doc = await db.collection("characters").doc(id).get();
    return doc.exists
      ? ({ id: doc.id, ...doc.data() } as Character)
      : undefined;
  }

  async updateCharacter(
    id: string,
    updatedData: any,
  ): Promise<Character | null> {
    const characterRef = db.collection("characters").doc(id);
    const docSnapshot = await characterRef.get();
    if (!docSnapshot.exists) {
      return null;
    }
    await characterRef.update(updatedData);
    return { id, ...updatedData } as Character;
  }

  async getCharactersByUserId(userId: string): Promise<Character[]> {
    const snapshot = await db
      .collection("characters")
      .where("userId", "==", userId)
      .get();
    const results: Character[] = [];
    snapshot.forEach((doc) =>
      results.push({ id: doc.id, ...doc.data() } as Character),
    );
    return results;
  }
  async getCharactersByType(type: string): Promise<Character[]> {
    const snapshot = await db
      .collection("characters")
      .where("type", "==", type)
      .get();
    const results: Character[] = [];
    snapshot.forEach((doc) =>
      results.push({ id: doc.id, ...doc.data() } as Character),
    );
    return results;
  }

  async getMainCharacters(userId?: string): Promise<Character[]> {
    let query = db.collection("characters").where("type", "==", "main");

    if (userId) {
      query = query.where("userId", "==", userId);
    }

    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();
    const results: Character[] = [];
    snapshot.forEach((doc) =>
      results.push({ id: doc.id, ...doc.data() } as Character),
    );
    return results;
  }

  async getSideCharacters(userId?: string): Promise<Character[]> {
    let query = db.collection("characters").where("type", "==", "side");

    if (userId) {
      query = query.where("userId", "==", userId);
    }

    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.get();
    const results: Character[] = [];
    snapshot.forEach((doc) =>
      results.push({ id: doc.id, ...doc.data() } as Character),
    );
    return results;
  }

  async getPredefinedCharacters(): Promise<Character[]> {
    const snapshot = await db
      .collection("characters")
      .where("type", "==", "predefined")
      .get();
    const results: Character[] = [];
    snapshot.forEach((doc) =>
      results.push({ id: doc.id, ...doc.data() } as Character),
    );
    return results;
  }
  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const data = {
      ...insertCharacter,
      createdAt: new Date().toISOString(),
      age: insertCharacter.age || null,
      gender: insertCharacter.gender || null,
      predefinedId: insertCharacter.predefinedId || null,
      description: insertCharacter.description || null,
      imageUrls: insertCharacter.imageUrls || [],
      relations: insertCharacter.relations || [],
      type: insertCharacter.type || "main",
    };
    const docRef = await db.collection("characters").add(data);
    return { id: docRef.id, ...data } as Character;
  }
  // ---------- Story operations -----------
  async getStory(id: string): Promise<Story | undefined> {
    const doc = await db.collection("stories").doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Story) : undefined;
  }
  async getStoriesByUserId(userId: string): Promise<Story[]> {
    const snapshot = await db
      .collection("stories")
      .where("userId", "==", userId)
      .get();
    const results: Story[] = [];
    snapshot.forEach((doc) =>
      results.push({ id: doc.id, ...doc.data() } as Story),
    );
    return results;
  }
  async getStoriesByType(type: string): Promise<Story[]> {
    const snapshot = await db
      .collection("stories")
      .where("type", "==", type)
      .get();
    const results: Story[] = [];
    snapshot.forEach((doc) =>
      results.push({ id: doc.id, ...doc.data() } as Story),
    );
    return results;
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const data = {
      ...insertStory,
      createdAt: new Date().toISOString(),
      predefinedId: insertStory.predefinedId || null,
      genre: insertStory.genre || null,
      instructions: insertStory.instructions || null,
      elements: insertStory.elements || null,
      type: insertStory.type || "custom",
      rhyming: insertStory.rhyming || false,
      theme: insertStory.theme || null,
      moral: insertStory.moral || "",
    };
    const docRef = await db.collection("stories").add(data);
    return { id: docRef.id, ...data } as Story;
  }
  // ---------- Book operations -----------
  async getBook(id: string): Promise<Book | undefined> {
    const doc = await db.collection("books").doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Book) : undefined;
  }
  async getBooksByUserId(userId: string): Promise<Book[]> {
    const snapshot = await db
      .collection("books")
      .where("userId", "==", userId)
      .get();
    const results: Book[] = [];
    snapshot.forEach((doc) =>
      results.push({ id: doc.id, ...doc.data() } as Book),
    );
    return results;
  }
  async createBook(insertBook: InsertBook): Promise<Book> {
    const data = {
      ...insertBook,
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection("books").add(data);
    return { id: docRef.id, ...data } as Book;
  }
  async getBookById(id: string): Promise<Book | null> {
    console.log("storage.ts - getBookById called with id:", id);
    try {
      const bookDoc = await db.collection("books").doc(id).get();
      if (!bookDoc.exists) {
        console.log("storage.ts - Book not found for id:", id);
        return null;
      }
      const bookData = bookDoc.data();
      console.log("storage.ts - Book found for id:", id, bookData);
      return bookData;
    } catch (error) {
      console.error("storage.ts - Error fetching book with id:", id, error);
      throw error;
    }
  }
  async updateBook(id: string, updatedData: any): Promise<Book | null> {
    console.log("storage.ts - updateBook called with id:", id);
    const bookRef = db.collection("books").doc(id);
    const doc = await bookRef.get();
    if (!doc.exists) {
      return null;
    }
    await bookRef.update(updatedData);
    return { id, ...updatedData };
  }

  async updateBookPageContent(
    bookId: string,
    pageId: number,
    newContent: string,
  ): Promise<Book | null> {
    const bookRef = db.collection("books").doc(bookId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookRef);
      if (!snap.exists) {
        console.log(`return null reason no-document bookId ${bookId}`);
        return null;
      }

      const data = snap.data() as Book;
      if (!Array.isArray(data.pages)) {
        console.log(`return null reason pages-not-array bookId ${bookId}`);
        return null;
      }

      const pages = [...data.pages]; // clone
      const idx = pages.findIndex((p) => p.scene_number === pageId - 1);
      if (idx === -1) {
        console.log(`return null reason pageId-not-found ${pageId}`);
        return null;
      }

      pages[idx] = { ...pages[idx], content: newContent }; // mutate
      tx.update(bookRef, { pages }); // write whole array
    });

    const after = await bookRef.get();
    return { id: bookId, ...(after.data() as Book) };
  }

  // ---------- Order operations -----------
  async getOrder(id: string): Promise<Order | undefined> {
    const doc = await db.collection("orders").doc(id).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Order) : undefined;
  }
  async getOrdersByUserId(userId: string): Promise<Order[]> {
    const snapshot = await db
      .collection("orders")
      .where("userId", "==", userId)
      .get();
    const results: Order[] = [];
    snapshot.forEach((doc) =>
      results.push({ id: doc.id, ...doc.data() } as Order),
    );
    return results;
  }
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const data = {
      ...insertOrder,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    const docRef = await db.collection("orders").add(data);
    return { id: docRef.id, ...data } as Order;
  }

  async updateOrder(id: string, updatedData: any): Promise<Order | null> {
    const orderRef = db.collection("orders").doc(id);
    const doc = await orderRef.get();
    if (!doc.exists) {
      return null;
    }
    await orderRef.update(updatedData);
    const updatedDoc = await orderRef.get();
    return { id, ...updatedDoc.data() } as Order;
  }
}

export const storage = new FirestoreStorage();
