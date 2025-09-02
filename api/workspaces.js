import { storage } from '../server/storage';

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'POST':
        // Create workspace
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
        break;

      case 'GET':
        // Get workspace by ID
        const { id: workspaceId } = req.query;
        
        if (!workspaceId) {
          return res.status(400).json({ error: "Workspace ID is required" });
        }

        const workspace = await storage.getWorkspace(workspaceId);
        if (!workspace) {
          return res.status(404).json({ error: "Workspace not found" });
        }
        
        res.json(workspace);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Workspace API error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
