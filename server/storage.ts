import { type User, type InsertUser, type Collection, type InsertCollection, type Bookmark, type InsertBookmark } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCollections(userId: string): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, updates: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: string): Promise<boolean>;
  
  getBookmarks(userId: string, collectionId?: string): Promise<Bookmark[]>;
  getBookmark(id: string): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: string, updates: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: string): Promise<boolean>;
  searchBookmarks(userId: string, query: string): Promise<Bookmark[]>;
  getPinnedBookmarks(userId: string): Promise<Bookmark[]>;
  getRecentBookmarks(userId: string, limit?: number): Promise<Bookmark[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private collections: Map<string, Collection> = new Map();
  private bookmarks: Map<string, Bookmark> = new Map();

  constructor() {
    // Create a demo user
    const demoUser: User = {
      id: "demo-user-1",
      username: "demo",
      password: "demo",
      email: "demo@example.com",
      name: "Demo User",
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo collections
    const designCollection: Collection = {
      id: "collection-1",
      name: "Design Resources",
      description: "A curated collection of design tools, inspiration, and resources",
      userId: demoUser.id,
      order: "1",
      createdAt: new Date(),
    };
    this.collections.set(designCollection.id, designCollection);

    const workCollection: Collection = {
      id: "collection-2",
      name: "Work Tools",
      description: "Essential tools for daily work",
      userId: demoUser.id,
      order: "2",
      createdAt: new Date(),
    };
    this.collections.set(workCollection.id, workCollection);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getCollections(userId: string): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .filter(collection => collection.userId === userId)
      .sort((a, b) => a.order.localeCompare(b.order));
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const id = randomUUID();
    const newCollection: Collection = {
      ...collection,
      id,
      createdAt: new Date(),
    };
    this.collections.set(id, newCollection);
    return newCollection;
  }

  async updateCollection(id: string, updates: Partial<InsertCollection>): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    
    const updated = { ...collection, ...updates };
    this.collections.set(id, updated);
    return updated;
  }

  async deleteCollection(id: string): Promise<boolean> {
    return this.collections.delete(id);
  }

  async getBookmarks(userId: string, collectionId?: string): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => {
        if (bookmark.userId !== userId) return false;
        if (collectionId && bookmark.collectionId !== collectionId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getBookmark(id: string): Promise<Bookmark | undefined> {
    return this.bookmarks.get(id);
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const now = new Date();
    const newBookmark: Bookmark = {
      ...bookmark,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.bookmarks.set(id, newBookmark);
    return newBookmark;
  }

  async updateBookmark(id: string, updates: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) return undefined;
    
    const updated = { 
      ...bookmark, 
      ...updates,
      updatedAt: new Date(),
    };
    this.bookmarks.set(id, updated);
    return updated;
  }

  async deleteBookmark(id: string): Promise<boolean> {
    return this.bookmarks.delete(id);
  }

  async searchBookmarks(userId: string, query: string): Promise<Bookmark[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.bookmarks.values())
      .filter(bookmark => {
        if (bookmark.userId !== userId) return false;
        return (
          bookmark.title.toLowerCase().includes(lowerQuery) ||
          bookmark.description?.toLowerCase().includes(lowerQuery) ||
          bookmark.url.toLowerCase().includes(lowerQuery) ||
          bookmark.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      })
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async getPinnedBookmarks(userId: string): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId && bookmark.isPinned)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async getRecentBookmarks(userId: string, limit: number = 10): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
