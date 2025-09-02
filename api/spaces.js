import { storage } from '../server/storage';

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        // Get spaces for a workspace
        const { workspaceId } = req.query;
        
        if (!workspaceId) {
          return res.status(400).json({ error: "Workspace ID is required" });
        }

        const spaces = await storage.getSpaces(workspaceId);
        res.json(spaces);
        break;

      case 'POST':
        // Create new space
        const spaceData = req.body;
        
        if (!spaceData.workspaceId || !spaceData.name) {
          return res.status(400).json({ error: "Workspace ID and name are required" });
        }

        const newSpace = await storage.createSpace(spaceData);
        res.status(201).json(newSpace);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Spaces API error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
