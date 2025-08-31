import { type User, type InsertUser, type Collection, type InsertCollection, type Bookmark, type InsertBookmark, type Share, type InsertShare } from "@shared/schema";
import { SupabaseStorage } from './supabase-storage';

export interface IStorage {
  // Workspace operations
  getWorkspace(id: string): Promise<any | undefined>;
  createWorkspace(id: string): Promise<any>;
  
  // Space operations
  getSpaces(workspaceId: string): Promise<any[]>;
  getSpace(id: string): Promise<any | undefined>;
  createSpace(space: any): Promise<any>;
  updateSpace(id: string, updates: Partial<any>): Promise<any | undefined>;
  deleteSpace(id: string): Promise<boolean>;
  
  // Collection operations
  getCollections(spaceId: string): Promise<Collection[]>;
  getAllCollections(workspaceId?: string): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, updates: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: string): Promise<boolean>;
  
  // Bookmark operations
  getBookmarks(collectionId?: string, spaceId?: string): Promise<Bookmark[]>;
  getBookmark(id: string): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: string, updates: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: string): Promise<boolean>;
  reorderBookmarks(collectionId: string, bookmarkIds: string[]): Promise<Bookmark[]>;
  searchBookmarks(query: string): Promise<Bookmark[]>;
  getPinnedBookmarks(): Promise<Bookmark[]>;
  getRecentBookmarks(limit?: number): Promise<Bookmark[]>;
  
  // Share management
  getShares(workspaceId: string): Promise<Share[]>;
  getShare(id: string): Promise<Share | undefined>;
  getShareByViewKey(viewKey: string): Promise<Share | undefined>;
  createShare(share: InsertShare): Promise<Share>;
  updateShare(id: string, updates: Partial<InsertShare>): Promise<Share | undefined>;
  deleteShare(id: string): Promise<boolean>;
}

// Use Supabase storage
export const storage = new SupabaseStorage();
