// Workspace management for Magic Link System
export interface Workspace {
  id: string;
  createdAt: string;
  updatedAt: string;
}

const WORKSPACE_STORAGE_KEY = 'toby_workspace_id';

export class WorkspaceManager {
  private static instance: WorkspaceManager;
  private currentWorkspaceId: string | null = null;

  private constructor() {
    this.loadWorkspaceFromStorage();
  }

  static getInstance(): WorkspaceManager {
    if (!WorkspaceManager.instance) {
      WorkspaceManager.instance = new WorkspaceManager();
    }
    return WorkspaceManager.instance;
  }

  private loadWorkspaceFromStorage(): void {
    try {
      const storedId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (storedId) {
        this.currentWorkspaceId = storedId;
      }
    } catch (error) {
      console.warn('Failed to load workspace from localStorage:', error);
    }
  }

  private saveWorkspaceToStorage(workspaceId: string): void {
    try {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
    } catch (error) {
      console.warn('Failed to save workspace to localStorage:', error);
    }
  }

  async getOrCreateWorkspace(): Promise<string> {
    if (this.currentWorkspaceId) {
      return this.currentWorkspaceId;
    }

    // Generate new workspace ID
    const newWorkspaceId = this.generateWorkspaceId();
    
    try {
      // Create workspace in database
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: newWorkspaceId }),
      });

      if (response.ok) {
        this.currentWorkspaceId = newWorkspaceId;
        this.saveWorkspaceToStorage(newWorkspaceId);
        return newWorkspaceId;
      } else {
        throw new Error('Failed to create workspace');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      // Fallback: use generated ID even if database creation fails
      this.currentWorkspaceId = newWorkspaceId;
      this.saveWorkspaceToStorage(newWorkspaceId);
      return newWorkspaceId;
    }
  }

  async loadWorkspace(workspaceId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      if (response.ok) {
        this.currentWorkspaceId = workspaceId;
        this.saveWorkspaceToStorage(workspaceId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading workspace:', error);
      return false;
    }
  }

  getCurrentWorkspaceId(): string | null {
    return this.currentWorkspaceId;
  }

  private generateWorkspaceId(): string {
    // Use default-workspace for new users to get sample data
    return 'default-workspace';
  }

  getWorkspaceUrl(workspaceId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/w/${workspaceId}`;
  }

  getCurrentWorkspaceUrl(): string | null {
    if (!this.currentWorkspaceId) return null;
    return this.getWorkspaceUrl(this.currentWorkspaceId);
  }

  clearWorkspace(): void {
    this.currentWorkspaceId = null;
    try {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear workspace from localStorage:', error);
    }
  }

  resetToDefaultWorkspace(): void {
    this.currentWorkspaceId = 'default-workspace';
    this.saveWorkspaceToStorage('default-workspace');
  }
}

// Export singleton instance
export const workspaceManager = WorkspaceManager.getInstance();
