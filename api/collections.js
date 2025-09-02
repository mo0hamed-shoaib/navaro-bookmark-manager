import { storage } from '../server/storage';

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        // Get collections for a space
        const { spaceId } = req.query;
        
        if (!spaceId) {
          return res.status(400).json({ error: "Space ID is required" });
        }

        const collections = await storage.getCollections(spaceId);
        res.json(collections);
        break;

      case 'POST':
        // Create new collection
        const collectionData = req.body;
        
        if (!collectionData.spaceId || !collectionData.name) {
          return res.status(400).json({ error: "Space ID and name are required" });
        }

        const newCollection = await storage.createCollection(collectionData);
        res.status(201).json(newCollection);
        break;

      case 'PUT':
        // Update collection
        const { id } = req.query;
        const updateData = req.body;
        
        if (!id) {
          return res.status(400).json({ error: "Collection ID is required" });
        }

        const updatedCollection = await storage.updateCollection(id, updateData);
        if (!updatedCollection) {
          return res.status(404).json({ error: "Collection not found" });
        }
        
        res.json(updatedCollection);
        break;

      case 'DELETE':
        // Delete collection
        const { id: deleteId } = req.query;
        
        if (!deleteId) {
          return res.status(400).json({ error: "Collection ID is required" });
        }

        const deleted = await storage.deleteCollection(deleteId);
        if (!deleted) {
          return res.status(404).json({ error: "Collection not found" });
        }
        
        res.json({ success: true });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Collections API error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
