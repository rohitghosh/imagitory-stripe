import {
  users,
  characters,
  stories,
  books,
  orders,
  type User,
  type Character,
  type Story,
  type Book,
  type Order,
  type InsertUser,
  type InsertCharacter,
  type InsertStory,
  type InsertBook,
  type InsertOrder
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Character operations
  getCharacter(id: number): Promise<Character | undefined>;
  getCharactersByUserId(userId: number): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  
  // Story operations
  getStory(id: number): Promise<Story | undefined>;
  getStoriesByUserId(userId: number): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  
  // Book operations
  getBook(id: number): Promise<Book | undefined>;
  getBooksByUserId(userId: number): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private characters: Map<number, Character>;
  private stories: Map<number, Story>;
  private books: Map<number, Book>;
  private orders: Map<number, Order>;
  
  private userId = 1;
  private characterId = 1;
  private storyId = 1;
  private bookId = 1;
  private orderId = 1;

  constructor() {
    this.users = new Map();
    this.characters = new Map();
    this.stories = new Map();
    this.books = new Map();
    this.orders = new Map();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.uid === uid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    // Ensure all required fields are present
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      displayName: insertUser.displayName || null,
      photoURL: insertUser.photoURL || null 
    };
    this.users.set(id, user);
    return user;
  }
  
  // Character operations
  async getCharacter(id: number): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async getCharactersByUserId(userId: number | undefined): Promise<Character[]> {
    if (!userId) return [];
    return Array.from(this.characters.values()).filter(
      character => character.userId === userId
    );
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const id = this.characterId++;
    const createdAt = new Date();
    const character: Character = { ...insertCharacter, id, createdAt };
    this.characters.set(id, character);
    return character;
  }
  
  // Story operations
  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async getStoriesByUserId(userId: number): Promise<Story[]> {
    return Array.from(this.stories.values()).filter(
      story => story.userId === userId
    );
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.storyId++;
    const createdAt = new Date();
    const story: Story = { ...insertStory, id, createdAt };
    this.stories.set(id, story);
    return story;
  }
  
  // Book operations
  async getBook(id: number): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async getBooksByUserId(userId: number): Promise<Book[]> {
    return Array.from(this.books.values()).filter(
      book => book.userId === userId
    );
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = this.bookId++;
    const createdAt = new Date();
    const book: Book = { ...insertBook, id, createdAt };
    this.books.set(id, book);
    return book;
  }
  
  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      order => order.userId === userId
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const createdAt = new Date();
    const order: Order = { ...insertOrder, id, status: "pending", createdAt };
    this.orders.set(id, order);
    return order;
  }
}

export const storage = new MemStorage();
