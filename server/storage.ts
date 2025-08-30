import { type User, type InsertUser, type Collection, type InsertCollection, type Bookmark, type InsertBookmark } from "@shared/schema";
import { SupabaseStorage } from './supabase-storage';

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

// Use Supabase storage
export const storage = new SupabaseStorage();
