import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCollectionSchema, insertBookmarkSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";
import { AbortController } from "abort-controller";
import * as cheerio from "cheerio";

export async function registerRoutes(app: Express): Promise<Server> {
  // Collections routes
  app.get("/api/collections", async (req, res) => {
    try {
      const userId = "demo-user-1"; // For demo purposes
      const collections = await storage.getCollections(userId);
      res.json(collections);
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
      const userId = "demo-user-1"; // For demo purposes
      const data = insertCollectionSchema.parse({ ...req.body, userId });
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
      const userId = "demo-user-1"; // For demo purposes
      const collectionId = req.query.collectionId as string;
      const bookmarks = await storage.getBookmarks(userId, collectionId);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.get("/api/bookmarks/search", async (req, res) => {
    try {
      const userId = "demo-user-1"; // For demo purposes
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const bookmarks = await storage.searchBookmarks(userId, query);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to search bookmarks" });
    }
  });

  app.get("/api/bookmarks/pinned", async (req, res) => {
    try {
      const userId = "demo-user-1"; // For demo purposes
      const bookmarks = await storage.getPinnedBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pinned bookmarks" });
    }
  });

  app.get("/api/bookmarks/recent", async (req, res) => {
    try {
      const userId = "demo-user-1"; // For demo purposes
      const limit = parseInt(req.query.limit as string) || 10;
      const bookmarks = await storage.getRecentBookmarks(userId, limit);
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
      const userId = "demo-user-1"; // For demo purposes
      const data = insertBookmarkSchema.parse({ ...req.body, userId });
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
        console.log('Could not fetch webpage for preview:', fetchError.message);
        
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
          console.log('Could not parse URL for fallback:', urlError.message);
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
            console.log('Could not generate fallback image:', error.message);
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

  const httpServer = createServer(app);
  return httpServer;
}
