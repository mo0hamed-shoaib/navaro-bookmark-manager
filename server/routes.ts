import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSpaceSchema, insertCollectionSchema, insertBookmarkSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";
import { AbortController } from "abort-controller";
import * as cheerio from "cheerio";

export async function registerRoutes(app: Express): Promise<Server> {
  // Workspace routes for Magic Link System
  app.post("/api/workspaces", async (req, res) => {
    try {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: "Workspace ID is required" });
      }

      // Check if workspace already exists
      const existingWorkspace = await storage.getWorkspace(id);
      if (existingWorkspace) {
        return res.status(200).json(existingWorkspace);
      }

      // Create new workspace
      const workspace = await storage.createWorkspace(id);
      res.status(201).json(workspace);
    } catch (error) {
      console.error("Error creating workspace:", error);
      res.status(500).json({ 
        error: "Failed to create workspace", 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/workspaces/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const workspace = await storage.getWorkspace(id);
      
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      
      res.json(workspace);
    } catch (error) {
      console.error("Error getting workspace:", error);
      res.status(500).json({ error: "Failed to get workspace" });
    }
  });

  // Spaces routes
  app.get("/api/spaces", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string || "default-workspace";
      const spaces = await storage.getSpaces(workspaceId);
      res.json(spaces);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spaces" });
    }
  });

  app.get("/api/spaces/:id", async (req, res) => {
    try {
      const space = await storage.getSpace(req.params.id);
      if (!space) {
        return res.status(404).json({ message: "Space not found" });
      }
      res.json(space);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch space" });
    }
  });

  app.post("/api/spaces", async (req, res) => {
    try {
      const data = insertSpaceSchema.parse(req.body);
      const space = await storage.createSpace(data);
      res.status(201).json(space);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create space" });
    }
  });

  app.put("/api/spaces/:id", async (req, res) => {
    try {
      const updates = insertSpaceSchema.partial().parse(req.body);
      const space = await storage.updateSpace(req.params.id, updates);
      if (!space) {
        return res.status(404).json({ message: "Space not found" });
      }
      res.json(space);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update space" });
    }
  });

  app.delete("/api/spaces/:id", async (req, res) => {
    try {
      const success = await storage.deleteSpace(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Space not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete space" });
    }
  });

  // Collections routes
  app.get("/api/collections", async (req, res) => {
    try {
      const spaceId = req.query.spaceId as string;
      const workspaceId = req.query.workspaceId as string;
      
      // If spaceId provided, get collections for that space
      if (spaceId) {
        const collections = await storage.getCollections(spaceId);
        res.json(collections);
      } 
      // If workspaceId provided, get all collections for that workspace
      else if (workspaceId) {
        const collections = await storage.getAllCollections(workspaceId);
        res.json(collections);
      }
      // Otherwise, get all collections (fallback)
      else {
        const collections = await storage.getAllCollections();
        res.json(collections);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.get("/api/collections/:id", async (req, res) => {
    try {
      const collection = await storage.getCollection(req.params.id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  app.post("/api/collections", async (req, res) => {
    try {
      const data = insertCollectionSchema.parse(req.body);
      const collection = await storage.createCollection(data);
      res.status(201).json(collection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  app.put("/api/collections/:id", async (req, res) => {
    try {
      const updates = insertCollectionSchema.partial().parse(req.body);
      const collection = await storage.updateCollection(req.params.id, updates);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update collection" });
    }
  });

  app.delete("/api/collections/:id", async (req, res) => {
    try {
      const success = await storage.deleteCollection(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Collection not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });

  // Bookmarks routes
  app.get("/api/bookmarks", async (req, res) => {
    try {
      const collectionId = req.query.collectionId as string;
      const spaceId = req.query.spaceId as string;
      const bookmarks = await storage.getBookmarks(collectionId, spaceId);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.get("/api/bookmarks/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const bookmarks = await storage.searchBookmarks(query);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to search bookmarks" });
    }
  });

  app.get("/api/bookmarks/pinned", async (req, res) => {
    try {
      const bookmarks = await storage.getPinnedBookmarks();
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pinned bookmarks" });
    }
  });

  app.get("/api/bookmarks/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const bookmarks = await storage.getRecentBookmarks(limit);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent bookmarks" });
    }
  });

  app.get("/api/bookmarks/:id", async (req, res) => {
    try {
      const bookmark = await storage.getBookmark(req.params.id);
      if (!bookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      res.json(bookmark);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookmark" });
    }
  });

  app.post("/api/bookmarks", async (req, res) => {
    try {
      const data = insertBookmarkSchema.parse(req.body);
      const bookmark = await storage.createBookmark(data);
      res.status(201).json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  app.put("/api/bookmarks/:id", async (req, res) => {
    try {
      const updates = insertBookmarkSchema.partial().parse(req.body);
      const bookmark = await storage.updateBookmark(req.params.id, updates);
      if (!bookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      res.json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update bookmark" });
    }
  });

  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      const success = await storage.deleteBookmark(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // Bookmark preview endpoint
  app.get("/api/bookmark-preview", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ message: "URL parameter is required" });
      }

      // Try to fetch the webpage and extract metadata
      try {
        console.log('Fetching preview for URL:', url);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
        }, 5000);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (response.ok) {
          console.log('Successfully fetched webpage, status:', response.status);
          const html = await response.text();
          console.log('HTML length:', html.length);
          
          const $ = cheerio.load(html);

          // Extract Open Graph and meta tags
          const title = $('meta[property="og:title"]').attr('content') || 
                       $('meta[name="twitter:title"]').attr('content') ||
                       $('title').text() ||
                       new URL(url).hostname;

          const description = $('meta[property="og:description"]').attr('content') ||
                            $('meta[name="twitter:description"]').attr('content') ||
                            $('meta[name="description"]').attr('content') ||
                            `Visit ${new URL(url).hostname}`;

          let image = $('meta[property="og:image"]').attr('content') ||
                     $('meta[name="twitter:image"]').attr('content') ||
                     $('meta[name="twitter:image:src"]').attr('content') ||
                     null;

          // Make relative image URLs absolute
          if (image && !image.startsWith('http')) {
            const baseUrl = new URL(url);
            image = new URL(image, baseUrl).href;
          }

          const preview = {
            title: title.trim(),
            description: description.trim(),
            image: image
          };

          console.log('Extracted preview:', preview);
          return res.json(preview);
        } else {
          console.log('Failed to fetch webpage, status:', response.status);
          
          // For 403/429 errors, try to get at least a favicon
          if (response.status === 403 || response.status === 429) {
            const urlObj = new URL(url);
            const fallbackImage = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
            
            const preview = {
              title: urlObj.hostname,
              description: `Visit ${urlObj.hostname} (access restricted)`,
              image: fallbackImage
            };
            
            return res.json(preview);
          }
        }
      } catch (fetchError) {
        console.log('Could not fetch webpage for preview:', fetchError instanceof Error ? fetchError.message : 'Unknown error');
        
        // For network errors, still try to provide a favicon
        try {
          const urlObj = new URL(url);
          const fallbackImage = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
          
          const preview = {
            title: urlObj.hostname,
            description: `Visit ${urlObj.hostname} (network error)`,
            image: fallbackImage
          };
          
          return res.json(preview);
        } catch (urlError) {
          console.log('Could not parse URL for fallback:', urlError instanceof Error ? urlError.message : 'Unknown error');
        }
      }

                // Fallback to basic preview data
          const urlObj = new URL(url);
          
          // Try to generate a fallback image using a service like Google's favicon service
          let fallbackImage = null;
          try {
            // Use Google's favicon service as a fallback image
            fallbackImage = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
          } catch (error) {
            console.log('Could not generate fallback image:', error instanceof Error ? error.message : 'Unknown error');
          }
          
          const preview = {
            title: urlObj.hostname,
            description: `Visit ${urlObj.hostname}`,
            image: fallbackImage
          };

          res.json(preview);
    } catch (error) {
      console.error('Preview extraction error:', error);
      res.status(500).json({ message: "Failed to extract preview data" });
    }
  });



  // Share routes
  app.get("/api/shares", async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      
      if (!workspaceId) {
        return res.status(400).json({ message: "Workspace ID is required" });
      }
      
      const shares = await storage.getShares(workspaceId);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shares" });
    }
  });

  app.get("/api/shares/:id", async (req, res) => {
    try {
      const share = await storage.getShare(req.params.id);
      if (!share) {
        return res.status(404).json({ message: "Share not found" });
      }
      res.json(share);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch share" });
    }
  });

  app.get("/api/shares/view/:viewKey", async (req, res) => {
    try {
      const share = await storage.getShareByViewKey(req.params.viewKey);
      if (!share) {
        return res.status(404).json({ message: "Share not found or expired" });
      }
      res.json(share);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch share" });
    }
  });

  app.post("/api/shares", async (req, res) => {
    try {
      const { workspaceId, name, description, expiresAt } = req.body;
      
      if (!workspaceId) {
        return res.status(400).json({ message: "Workspace ID is required" });
      }

      // Generate a unique view key
      const viewKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const share = await storage.createShare({
        workspaceId,
        viewKey,
        name,
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      
      res.status(201).json(share);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create share" });
    }
  });

  app.put("/api/shares/:id", async (req, res) => {
    try {
      const { name, description, expiresAt } = req.body;
      
      const share = await storage.updateShare(req.params.id, {
        name,
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      
      if (!share) {
        return res.status(404).json({ message: "Share not found" });
      }
      res.json(share);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update share" });
    }
  });

  app.delete("/api/shares/:id", async (req, res) => {
    try {
      const success = await storage.deleteShare(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Share not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete share" });
    }
  });

  // Import/Export routes
  app.post("/api/import", async (req, res) => {
    try {
      const { workspaceId, importData } = req.body;
      
      if (!workspaceId) {
        return res.status(400).json({ message: "Workspace ID is required" });
      }

      if (!importData || !importData.spaces || !importData.collections || !importData.bookmarks) {
        return res.status(400).json({ message: "Invalid import data format" });
      }

      // Import spaces
      const importedSpaces = [];
      for (const spaceData of importData.spaces) {
        try {
          const space = await storage.createSpace({
            workspaceId,
            name: spaceData.name,
            description: spaceData.description || "",
            icon: spaceData.icon || "📁",
            orderIndex: spaceData.orderIndex || "0"
          });
          importedSpaces.push(space);
        } catch (error) {
          console.error(`Error importing space ${spaceData.name}:`, error);
        }
      }

      // Import collections
      const importedCollections = [];
      for (const collectionData of importData.collections) {
        try {
          // Find the corresponding space by name (since IDs will be different)
          const targetSpace = importedSpaces.find(s => s.name === collectionData.spaceName);
          
          if (targetSpace) {
            const collection = await storage.createCollection({
              spaceId: targetSpace.id,
              name: collectionData.name,
              description: collectionData.description || "",
              icon: collectionData.icon || "📁",
              orderIndex: collectionData.orderIndex || "0",
              viewMode: collectionData.viewMode || "grid"
            });
            importedCollections.push(collection);
          }
        } catch (error) {
          console.error(`Error importing collection ${collectionData.name}:`, error);
        }
      }

      // Import bookmarks
      const importedBookmarks = [];
      for (const bookmarkData of importData.bookmarks) {
        try {
          // Find the corresponding collection by name
          const targetCollection = importedCollections.find(c => c.name === bookmarkData.collectionName);
          
          if (targetCollection) {
            const bookmark = await storage.createBookmark({
              collectionId: targetCollection.id,
              title: bookmarkData.title,
              url: bookmarkData.url,
              description: bookmarkData.description || "",
              favicon: bookmarkData.favicon || "",
              preview: bookmarkData.preview || null,
              tags: bookmarkData.tags || [],
              isPinned: bookmarkData.isPinned || false
            });
            importedBookmarks.push(bookmark);
          }
        } catch (error) {
          console.error(`Error importing bookmark ${bookmarkData.title}:`, error);
        }
      }

      res.status(200).json({
        message: "Import completed successfully",
        imported: {
          spaces: importedSpaces.length,
          collections: importedCollections.length,
          bookmarks: importedBookmarks.length
        }
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to import data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
