import { supabase } from './supabase';
import type { User, InsertUser, Collection, InsertCollection, Bookmark, InsertBookmark, Workspace } from '@shared/schema';

export interface ISupabaseStorage {
  // Workspace operations
  getWorkspace(id: string): Promise<Workspace | undefined>;
  createWorkspace(id: string): Promise<Workspace>;

  // User operations (for compatibility with existing interface)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Collection operations
  getCollections(userId: string): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, updates: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: string): Promise<boolean>;
  
  // Bookmark operations
  getBookmarks(userId: string, collectionId?: string): Promise<Bookmark[]>;
  getBookmark(id: string): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: string, updates: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: string): Promise<boolean>;
  searchBookmarks(userId: string, query: string): Promise<Bookmark[]>;
  getPinnedBookmarks(userId: string): Promise<Bookmark[]>;
  getRecentBookmarks(userId: string, limit?: number): Promise<Bookmark[]>;
}

export class SupabaseStorage implements ISupabaseStorage {
  // For now, we'll use a demo user ID to maintain compatibility
  private demoUserId = "demo-user-1";

  // Workspace operations (simplified for now)
  async getWorkspace(id: string): Promise<Workspace | undefined> {
    // For now, return a mock workspace to get the system working
    return {
      id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async createWorkspace(id: string): Promise<Workspace> {
    // For now, return a mock workspace to get the system working
    return {
      id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // User operations (simplified for demo)
  async getUser(id: string): Promise<User | undefined> {
    if (id === this.demoUserId) {
      return {
        id: this.demoUserId,
        username: "demo",
        password: "demo",
        email: "demo@example.com",
        name: "Demo User",
        createdAt: new Date(),
      };
    }
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (username === "demo") {
      return this.getUser(this.demoUserId);
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // For demo purposes, just return the demo user
    const demoUser = await this.getUser(this.demoUserId);
    if (!demoUser) {
      throw new Error('Demo user not found');
    }
    return demoUser;
  }

  // Collection operations
  async getCollections(userId: string): Promise<Collection[]> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Transform Supabase data to match our schema
      return data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        userId: userId, // Map to demo user for now
        order: item.order_index.toString(),
        createdAt: new Date(item.created_at),
      })) || [];
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        userId: this.demoUserId,
        order: data.order_index.toString(),
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Error fetching collection:', error);
      return undefined;
    }
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          name: collection.name,
          description: collection.description,
          icon: collection.icon,
          order_index: parseInt(collection.order || '0'),
          space_id: '00000000-0000-0000-0000-000000000000', // Default space for now
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        userId: this.demoUserId,
        order: data.order_index.toString(),
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  async updateCollection(id: string, updates: Partial<InsertCollection>): Promise<Collection | undefined> {
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.icon) updateData.icon = updates.icon;
      if (updates.order) updateData.order_index = parseInt(updates.order);

      const { data, error } = await supabase
        .from('collections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        userId: this.demoUserId,
        order: data.order_index.toString(),
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Error updating collection:', error);
      return undefined;
    }
  }

  async deleteCollection(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting collection:', error);
      return false;
    }
  }

  // Bookmark operations
  async getBookmarks(userId: string, collectionId?: string): Promise<Bookmark[]> {
    try {
      let query = supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });

      if (collectionId) {
        query = query.eq('collection_id', collectionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        title: item.title,
        url: item.url,
        description: item.description,
        favicon: item.favicon,
        preview: item.preview,
        tags: item.tags || [],
        userId: userId,
        collectionId: item.collection_id,
        isPinned: item.is_pinned,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }
  }

  async getBookmark(id: string): Promise<Bookmark | undefined> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;

      return {
        id: data.id,
        title: data.title,
        url: data.url,
        description: data.description,
        favicon: data.favicon,
        preview: data.preview,
        tags: data.tags || [],
        userId: this.demoUserId,
        collectionId: data.collection_id,
        isPinned: data.is_pinned,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error fetching bookmark:', error);
      return undefined;
    }
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description,
          favicon: bookmark.favicon,
          preview: bookmark.preview,
          tags: bookmark.tags,
          is_pinned: bookmark.isPinned,
          collection_id: bookmark.collectionId,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        url: data.url,
        description: data.description,
        favicon: data.favicon,
        preview: data.preview,
        tags: data.tags || [],
        userId: this.demoUserId,
        collectionId: data.collection_id,
        isPinned: data.is_pinned,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw error;
    }
  }

  async updateBookmark(id: string, updates: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.url) updateData.url = updates.url;
      if (updates.description) updateData.description = updates.description;
      if (updates.favicon) updateData.favicon = updates.favicon;
      if (updates.preview) updateData.preview = updates.preview;
      if (updates.tags) updateData.tags = updates.tags;
      if (updates.isPinned !== undefined) updateData.is_pinned = updates.isPinned;
      if (updates.collectionId) updateData.collection_id = updates.collectionId;

      const { data, error } = await supabase
        .from('bookmarks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;

      return {
        id: data.id,
        title: data.title,
        url: data.url,
        description: data.description,
        favicon: data.favicon,
        preview: data.preview,
        tags: data.tags || [],
        userId: this.demoUserId,
        collectionId: data.collection_id,
        isPinned: data.is_pinned,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error updating bookmark:', error);
      return undefined;
    }
  }

  async deleteBookmark(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      return false;
    }
  }

  async searchBookmarks(userId: string, query: string): Promise<Bookmark[]> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .textSearch('title,description,url', query)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        title: item.title,
        url: item.url,
        description: item.description,
        favicon: item.favicon,
        preview: item.preview,
        tags: item.tags || [],
        userId: userId,
        collectionId: item.collection_id,
        isPinned: item.is_pinned,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      return [];
    }
  }

  async getPinnedBookmarks(userId: string): Promise<Bookmark[]> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('is_pinned', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        title: item.title,
        url: item.url,
        description: item.description,
        favicon: item.favicon,
        preview: item.preview,
        tags: item.tags || [],
        userId: userId,
        collectionId: item.collection_id,
        isPinned: item.is_pinned,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error fetching pinned bookmarks:', error);
      return [];
    }
  }

  async getRecentBookmarks(userId: string, limit: number = 10): Promise<Bookmark[]> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        title: item.title,
        url: item.url,
        description: item.description,
        favicon: item.favicon,
        preview: item.preview,
        tags: item.tags || [],
        userId: userId,
        collectionId: item.collection_id,
        isPinned: item.is_pinned,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error fetching recent bookmarks:', error);
      return [];
    }
  }
}
