import { storage } from '../server/storage';

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        // Get bookmarks
        const { collectionId, spaceId } = req.query;
        
        if (!collectionId && !spaceId) {
          return res.status(400).json({ error: "Collection ID or Space ID is required" });
        }

        const bookmarks = await storage.getBookmarks(collectionId, spaceId);
        res.json(bookmarks);
        break;

      case 'POST':
        // Create new bookmark
        const bookmarkData = req.body;
        
        if (!bookmarkData.collectionId || !bookmarkData.title || !bookmarkData.url) {
          return res.status(400).json({ error: "Collection ID, title, and URL are required" });
        }

        const newBookmark = await storage.createBookmark(bookmarkData);
        res.status(201).json(newBookmark);
        break;

      case 'PUT':
        // Update bookmark
        const { id } = req.query;
        const updateData = req.body;
        
        if (!id) {
          return res.status(400).json({ error: "Bookmark ID is required" });
        }

        const updatedBookmark = await storage.updateBookmark(id, updateData);
        if (!updatedBookmark) {
          return res.status(404).json({ error: "Bookmark not found" });
        }
        
        res.json(updatedBookmark);
        break;

      case 'DELETE':
        // Delete bookmark
        const { id: deleteId } = req.query;
        
        if (!deleteId) {
          return res.status(400).json({ error: "Bookmark ID is required" });
        }

        const deleted = await storage.deleteBookmark(deleteId);
        if (!deleted) {
          return res.status(404).json({ error: "Bookmark not found" });
        }
        
        res.json({ success: true });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Bookmarks API error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
