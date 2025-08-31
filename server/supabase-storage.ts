import { supabase } from './supabase';
import type { User, InsertUser, Space, InsertSpace, Collection, InsertCollection, Bookmark, InsertBookmark, Workspace, Session, InsertSession, SessionTab, InsertSessionTab, Share, InsertShare } from '@shared/schema';

export interface ISupabaseStorage {
  // Workspace operations
  getWorkspace(id: string): Promise<Workspace | undefined>;
  createWorkspace(id: string): Promise<Workspace>;

  // Space operations
  getSpaces(workspaceId: string): Promise<Space[]>;
  getSpace(id: string): Promise<Space | undefined>;
  createSpace(space: InsertSpace): Promise<Space>;
  updateSpace(id: string, updates: Partial<InsertSpace>): Promise<Space | undefined>;
  deleteSpace(id: string): Promise<boolean>;

  // Collection operations
  getCollections(spaceId: string): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: string, updates: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: string): Promise<boolean>;
  
  // Bookmark operations
  getBookmarks(collectionId?: string): Promise<Bookmark[]>;
  getBookmark(id: string): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: string, updates: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: string): Promise<boolean>;
  searchBookmarks(query: string): Promise<Bookmark[]>;
  getPinnedBookmarks(): Promise<Bookmark[]>;
  getRecentBookmarks(limit?: number): Promise<Bookmark[]>;
  
  // Session operations
  getSessions(workspaceId: string): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  
  getSessionTabs(sessionId: string): Promise<SessionTab[]>;
  createSessionTab(tab: InsertSessionTab): Promise<SessionTab>;
  deleteSessionTab(id: string): Promise<boolean>;
  deleteSessionTabs(sessionId: string): Promise<boolean>;
  
  // Share operations
  getShares(workspaceId: string): Promise<Share[]>;
  getShare(id: string): Promise<Share | undefined>;
  getShareByViewKey(viewKey: string): Promise<Share | undefined>;
  createShare(share: InsertShare): Promise<Share>;
  updateShare(id: string, updates: Partial<InsertShare>): Promise<Share | undefined>;
  deleteShare(id: string): Promise<boolean>;
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

  // Space operations
  async getSpaces(workspaceId: string): Promise<Space[]> {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        workspaceId: item.workspace_id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        orderIndex: item.order_index.toString(),
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error fetching spaces:', error);
      return [];
    }
  }

  async getSpace(id: string): Promise<Space | undefined> {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        orderIndex: data.order_index.toString(),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error fetching space:', error);
      return undefined;
    }
  }

  async createSpace(space: InsertSpace): Promise<Space> {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .insert({
          workspace_id: space.workspaceId,
          name: space.name,
          description: space.description,
          icon: space.icon,
          order_index: parseInt(space.orderIndex || '0'),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        orderIndex: data.order_index.toString(),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error creating space:', error);
      throw error;
    }
  }

  async updateSpace(id: string, updates: Partial<InsertSpace>): Promise<Space | undefined> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.orderIndex !== undefined) updateData.order_index = parseInt(updates.orderIndex);

      const { data, error } = await supabase
        .from('spaces')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        orderIndex: data.order_index.toString(),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error updating space:', error);
      return undefined;
    }
  }

  async deleteSpace(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting space:', error);
      return false;
    }
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
  async getCollections(spaceId: string): Promise<Collection[]> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('space_id', spaceId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Transform Supabase data to match our schema
      return data?.map(item => ({
        id: item.id,
        spaceId: item.space_id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        orderIndex: item.order_index.toString(),
        viewMode: item.view_mode,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }

  async getAllCollections(workspaceId?: string): Promise<Collection[]> {
    try {
      // For now, just fetch all collections to get the counts working
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Transform Supabase data to match our schema
      return data?.map(item => ({
        id: item.id,
        spaceId: item.space_id,
        name: item.name,
        description: item.description,
        icon: item.icon,
        orderIndex: item.order_index.toString(),
        viewMode: item.view_mode,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error fetching all collections:', error);
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
        spaceId: data.space_id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        orderIndex: data.order_index.toString(),
        viewMode: data.view_mode,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
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
          order_index: parseInt(collection.orderIndex || '0'),
          view_mode: collection.viewMode,
          space_id: collection.spaceId,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        spaceId: data.space_id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        orderIndex: data.order_index.toString(),
        viewMode: data.view_mode,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
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
      if (updates.orderIndex) updateData.order_index = parseInt(updates.orderIndex);
      if (updates.viewMode) updateData.view_mode = updates.viewMode;

      const { data, error } = await supabase
        .from('collections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;

      return {
        id: data.id,
        spaceId: data.space_id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        orderIndex: data.order_index.toString(),
        viewMode: data.view_mode,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
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
  async getBookmarks(collectionId?: string, spaceId?: string): Promise<Bookmark[]> {
    try {
      let query = supabase
        .from('bookmarks')
        .select('*, collections!inner(*)')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (collectionId) {
        query = query.eq('collection_id', collectionId);
      } else if (spaceId) {
        // Filter by space through collections
        query = query.eq('collections.space_id', spaceId);
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
        collectionId: item.collection_id,
        isPinned: item.is_pinned,
        orderIndex: item.order_index || 0,
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
        collectionId: data.collection_id,
        isPinned: data.is_pinned,
        orderIndex: data.order_index || 0,
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
          order_index: bookmark.orderIndex || 0,
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
        collectionId: data.collection_id,
        isPinned: data.is_pinned,
        orderIndex: data.order_index || 0,
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
      if (updates.orderIndex !== undefined) updateData.order_index = updates.orderIndex;

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

  async reorderBookmarks(collectionId: string, bookmarkIds: string[]): Promise<Bookmark[]> {
    try {
      console.log('Starting reorder for collection:', collectionId, 'bookmarks:', bookmarkIds);
      
      // First, verify all bookmarks belong to the specified collection
      const { data: existingBookmarks, error: fetchError } = await supabase
        .from('bookmarks')
        .select('id, collection_id, title')
        .in('id', bookmarkIds);

      if (fetchError) {
        console.error('Error fetching existing bookmarks:', fetchError);
        throw fetchError;
      }

      console.log('Existing bookmarks:', existingBookmarks);

      // Check if all bookmarks belong to the specified collection
      const invalidBookmarks = existingBookmarks?.filter(b => b.collection_id !== collectionId);
      if (invalidBookmarks && invalidBookmarks.length > 0) {
        console.error('Some bookmarks do not belong to the specified collection:', invalidBookmarks);
        throw new Error('Invalid bookmark collection');
      }

      // Simple direct update approach
      console.log('Using simple direct update approach...');
      
      for (let i = 0; i < bookmarkIds.length; i++) {
        const bookmarkId = bookmarkIds[i];
        const newOrderIndex = i;
        
        console.log(`Updating bookmark ${bookmarkId} to order_index ${newOrderIndex}`);
        
        // Try the simplest possible update
        const { error: updateError } = await supabase
          .from('bookmarks')
          .update({ 
            order_index: newOrderIndex
          })
          .eq('id', bookmarkId);

        if (updateError) {
          console.error(`Error updating bookmark ${bookmarkId}:`, updateError);
          throw updateError;
        }
        
        console.log(`Successfully updated bookmark ${bookmarkId}`);
      }

      // Fetch the updated bookmarks
      const { data: updatedBookmarks, error: fetchUpdatedError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('collection_id', collectionId)
        .order('order_index', { ascending: true });

      if (fetchUpdatedError) {
        console.error('Error fetching updated bookmarks:', fetchUpdatedError);
        throw fetchUpdatedError;
      }

      console.log('Updated bookmarks:', updatedBookmarks);

      return updatedBookmarks?.map(item => ({
        id: item.id,
        title: item.title,
        url: item.url,
        description: item.description,
        favicon: item.favicon,
        preview: item.preview,
        tags: item.tags || [],
        collectionId: item.collection_id,
        isPinned: item.is_pinned,
        orderIndex: item.order_index || 0,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error reordering bookmarks:', error);
      return [];
    }
  }

  async searchBookmarks(query: string): Promise<Bookmark[]> {
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

  async getPinnedBookmarks(): Promise<Bookmark[]> {
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

  async getRecentBookmarks(limit: number = 10): Promise<Bookmark[]> {
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

  // Session operations
  async getSessions(workspaceId: string): Promise<Session[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        workspaceId: item.workspace_id,
        name: item.name,
        description: item.description,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  async getSession(id: string): Promise<Session | undefined> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return undefined;

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error fetching session:', error);
      return undefined;
    }
  }

  async createSession(session: InsertSession): Promise<Session> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          workspace_id: session.workspaceId,
          name: session.name,
          description: session.description,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async updateSession(id: string, updates: Partial<InsertSession>): Promise<Session | undefined> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) return undefined;

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error updating session:', error);
      return undefined;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  async getSessionTabs(sessionId: string): Promise<SessionTab[]> {
    try {
      const { data, error } = await supabase
        .from('session_tabs')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        sessionId: item.session_id,
        title: item.title,
        url: item.url,
        favicon: item.favicon,
        orderIndex: item.order_index,
        createdAt: new Date(item.created_at),
      })) || [];
    } catch (error) {
      console.error('Error fetching session tabs:', error);
      return [];
    }
  }

  async createSessionTab(tab: InsertSessionTab): Promise<SessionTab> {
    try {
      const { data, error } = await supabase
        .from('session_tabs')
        .insert({
          session_id: tab.sessionId,
          title: tab.title,
          url: tab.url,
          favicon: tab.favicon,
          order_index: tab.orderIndex,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        sessionId: data.session_id,
        title: data.title,
        url: data.url,
        favicon: data.favicon,
        orderIndex: data.order_index,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Error creating session tab:', error);
      throw error;
    }
  }

  async deleteSessionTab(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('session_tabs')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting session tab:', error);
      return false;
    }
  }

  async deleteSessionTabs(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('session_tabs')
        .delete()
        .eq('session_id', sessionId);

      return !error;
    } catch (error) {
      console.error('Error deleting session tabs:', error);
      return false;
    }
  }

  // Share operations
  async getShares(workspaceId: string): Promise<Share[]> {
    try {
      const { data, error } = await supabase
        .from('shares')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(item => ({
        id: item.id,
        workspaceId: item.workspace_id,
        viewKey: item.view_key,
        name: item.name,
        description: item.description,
        createdAt: new Date(item.created_at),
        expiresAt: item.expires_at ? new Date(item.expires_at) : null,
      })) || [];
    } catch (error) {
      console.error('Error fetching shares:', error);
      return [];
    }
  }

  async getShare(id: string): Promise<Share | undefined> {
    try {
      const { data, error } = await supabase
        .from('shares')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        viewKey: data.view_key,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      };
    } catch (error) {
      console.error('Error fetching share:', error);
      return undefined;
    }
  }

  async getShareByViewKey(viewKey: string): Promise<Share | undefined> {
    try {
      const { data, error } = await supabase
        .from('shares')
        .select('*')
        .eq('view_key', viewKey)
        .single();

      if (error) throw error;

      // Check if share has expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return undefined;
      }

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        viewKey: data.view_key,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      };
    } catch (error) {
      console.error('Error fetching share by view key:', error);
      return undefined;
    }
  }

  async createShare(share: InsertShare): Promise<Share> {
    try {
      const { data, error } = await supabase
        .from('shares')
        .insert({
          workspace_id: share.workspaceId,
          view_key: share.viewKey,
          name: share.name,
          description: share.description,
          expires_at: share.expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        viewKey: data.view_key,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      };
    } catch (error) {
      console.error('Error creating share:', error);
      throw error;
    }
  }

  async updateShare(id: string, updates: Partial<InsertShare>): Promise<Share | undefined> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt;

      const { data, error } = await supabase
        .from('shares')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        workspaceId: data.workspace_id,
        viewKey: data.view_key,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      };
    } catch (error) {
      console.error('Error updating share:', error);
      return undefined;
    }
  }

  async deleteShare(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shares')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting share:', error);
      return false;
    }
  }
}
