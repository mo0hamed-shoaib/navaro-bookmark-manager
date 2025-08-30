import { type User, type InsertUser, type Collection, type InsertCollection, type Bookmark, type InsertBookmark, type Session, type InsertSession, type SessionTab, type InsertSessionTab, type Share, type InsertShare } from "@shared/schema";
import { SupabaseStorage } from './supabase-storage';

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCollections(spaceId: string): Promise<Collection[]>;
  getAllCollections(workspaceId?: string): Promise<Collection[]>;
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
  
  // Session management
  getSessions(workspaceId: string): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  
  getSessionTabs(sessionId: string): Promise<SessionTab[]>;
  createSessionTab(tab: InsertSessionTab): Promise<SessionTab>;
  deleteSessionTab(id: string): Promise<boolean>;
  deleteSessionTabs(sessionId: string): Promise<boolean>;
  
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
