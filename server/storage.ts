import { type User, type InsertUser, type Collection, type InsertCollection, type Bookmark, type InsertBookmark } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCollections(userId: string): Promise<Collection[]>;
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private collections: Map<string, Collection> = new Map();
  private bookmarks: Map<string, Bookmark> = new Map();

  constructor() {
    // Create a demo user
    const demoUser: User = {
      id: "demo-user-1",
      username: "demo",
      password: "demo",
      email: "demo@example.com",
      name: "Demo User",
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo collections
    const designCollection: Collection = {
      id: "collection-1",
      name: "Design Resources",
      description: "A curated collection of design tools, inspiration, and resources",
      userId: demoUser.id,
      order: "1",
      createdAt: new Date(),
    };
    this.collections.set(designCollection.id, designCollection);

    const workCollection: Collection = {
      id: "collection-2",
      name: "Work Tools",
      description: "Essential tools for daily work",
      userId: demoUser.id,
      order: "2",
      createdAt: new Date(),
    };
    this.collections.set(workCollection.id, workCollection);

    const learnCollection: Collection = {
      id: "collection-3",
      name: "Learning Resources",
      description: "Educational content and tutorials",
      userId: demoUser.id,
      order: "3",
      createdAt: new Date(),
    };
    this.collections.set(learnCollection.id, learnCollection);

    // Create sample bookmarks
    const sampleBookmarks: Bookmark[] = [
      {
        id: "bookmark-1",
        title: "Figma",
        url: "https://figma.com",
        description: "Collaborative design platform for teams",
        favicon: "https://static.figma.com/app/icon/1/favicon.png",
        preview: {
          title: "Figma: The collaborative interface design tool",
          description: "Build better products as a team. Design, prototype, and gather feedback all in one place.",
          image: "https://cdn.sanity.io/images/599r6htc/localized/7db2c8c5e5d1e22c1f3a4e12dfcbb4b9fd6b7cc8-1200x630.png"
        },
        tags: ["design", "collaboration", "ui"],
        userId: demoUser.id,
        collectionId: designCollection.id,
        isPinned: true,
        createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
        updatedAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
      },
      {
        id: "bookmark-2",
        title: "GitHub",
        url: "https://github.com",
        description: "Version control and collaboration platform",
        favicon: "https://github.githubassets.com/favicons/favicon.png",
        preview: {
          title: "GitHub: Let's build from here",
          description: "GitHub is where over 100 million developers shape the future of software, together.",
          image: "https://github.githubassets.com/assets/campaign-social-031d6161fa10.png"
        },
        tags: ["development", "git", "collaboration"],
        userId: demoUser.id,
        collectionId: workCollection.id,
        isPinned: true,
        createdAt: new Date(Date.now() - 86400000 * 10), // 10 days ago
        updatedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      },
      {
        id: "bookmark-3",
        title: "Notion",
        url: "https://notion.so",
        description: "All-in-one workspace for notes, tasks, and collaboration",
        favicon: "https://www.notion.so/images/favicon.ico",
        preview: {
          title: "Notion – The all-in-one workspace for your notes, tasks, wikis, and databases.",
          description: "A new tool that blends your everyday work apps into one. It's the all-in-one workspace for you and your team.",
          image: "https://www.notion.so/images/meta/default.png"
        },
        tags: ["productivity", "notes", "organization"],
        userId: demoUser.id,
        collectionId: workCollection.id,
        isPinned: false,
        createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
        updatedAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
      },
      {
        id: "bookmark-4",
        title: "MDN Web Docs",
        url: "https://developer.mozilla.org",
        description: "Comprehensive web development documentation",
        favicon: "https://developer.mozilla.org/favicon-48x48.png",
        preview: {
          title: "MDN Web Docs",
          description: "The MDN Web Docs site provides information about Open Web technologies including HTML, CSS, and APIs for both Web sites and progressive web apps.",
          image: "https://developer.mozilla.org/mdn-social-share.png"
        },
        tags: ["documentation", "web", "learning"],
        userId: demoUser.id,
        collectionId: learnCollection.id,
        isPinned: false,
        createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
        updatedAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
      },
      {
        id: "bookmark-5",
        title: "Dribbble",
        url: "https://dribbble.com",
        description: "Design inspiration and portfolio platform",
        favicon: "https://cdn.dribbble.com/assets/favicon-b38525134603b4a8d4b31b9357a58ff0286a9930e1b72e72233e5c9a22f8a4f2.ico",
        preview: {
          title: "Dribbble - Discover the World's Top Designers & Creative Professionals",
          description: "Find Top Designers & Creative Professionals on Dribbble. We are where designers gain inspiration, feedback, community, and jobs.",
          image: "https://cdn.dribbble.com/assets/dribbble-ball-192-23ecbdf987832231e87c642bb25de821af1ba6734a626c8c259a20a0ca51a8d7.png"
        },
        tags: ["design", "inspiration", "portfolio"],
        userId: demoUser.id,
        collectionId: designCollection.id,
        isPinned: false,
        createdAt: new Date(Date.now() - 86400000 * 12), // 12 days ago
        updatedAt: new Date(Date.now() - 86400000 * 12), // 12 days ago
      },
      {
        id: "bookmark-6",
        title: "Tailwind CSS",
        url: "https://tailwindcss.com",
        description: "Utility-first CSS framework",
        favicon: "https://tailwindcss.com/favicons/favicon-32x32.png",
        preview: {
          title: "Tailwind CSS - Rapidly build modern websites without ever leaving your HTML.",
          description: "Tailwind CSS is a utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.",
          image: "https://tailwindcss.com/_next/static/media/social-card-large.a6e71726.jpg"
        },
        tags: ["css", "framework", "development"],
        userId: demoUser.id,
        collectionId: learnCollection.id,
        isPinned: true,
        createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
        updatedAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
      },
      {
        id: "bookmark-7",
        title: "Linear",
        url: "https://linear.app",
        description: "Issue tracking and project management for modern teams",
        favicon: "https://linear.app/favicon.ico",
        preview: {
          title: "Linear – The issue tracking tool you'll enjoy using",
          description: "Linear helps streamline software projects, sprints, tasks, and bug tracking. It's built for high-performance teams.",
          image: "https://linear.app/cdn-cgi/image/format=auto,width=1200,height=630,fit=crop/og-image.png"
        },
        tags: ["project-management", "productivity", "team"],
        userId: demoUser.id,
        collectionId: workCollection.id,
        isPinned: false,
        createdAt: new Date(Date.now() - 86400000 * 8), // 8 days ago
        updatedAt: new Date(Date.now() - 86400000 * 8), // 8 days ago
      },
      {
        id: "bookmark-8",
        title: "React Documentation",
        url: "https://react.dev",
        description: "Official React library documentation",
        favicon: "https://react.dev/favicon.ico",
        preview: {
          title: "React",
          description: "The library for web and native user interfaces",
          image: "https://react.dev/images/og-home.png"
        },
        tags: ["react", "javascript", "documentation"],
        userId: demoUser.id,
        collectionId: learnCollection.id,
        isPinned: false,
        createdAt: new Date(Date.now() - 86400000 * 6), // 6 days ago
        updatedAt: new Date(Date.now() - 86400000 * 6), // 6 days ago
      }
    ];

    // Add all sample bookmarks to storage
    sampleBookmarks.forEach(bookmark => {
      this.bookmarks.set(bookmark.id, bookmark);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getCollections(userId: string): Promise<Collection[]> {
    return Array.from(this.collections.values())
      .filter(collection => collection.userId === userId)
      .sort((a, b) => a.order.localeCompare(b.order));
  }

  async getCollection(id: string): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const id = randomUUID();
    const newCollection: Collection = {
      ...collection,
      id,
      createdAt: new Date(),
    };
    this.collections.set(id, newCollection);
    return newCollection;
  }

  async updateCollection(id: string, updates: Partial<InsertCollection>): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    
    const updated = { ...collection, ...updates };
    this.collections.set(id, updated);
    return updated;
  }

  async deleteCollection(id: string): Promise<boolean> {
    return this.collections.delete(id);
  }

  async getBookmarks(userId: string, collectionId?: string): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => {
        if (bookmark.userId !== userId) return false;
        if (collectionId && bookmark.collectionId !== collectionId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getBookmark(id: string): Promise<Bookmark | undefined> {
    return this.bookmarks.get(id);
  }

  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const now = new Date();
    const newBookmark: Bookmark = {
      ...bookmark,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.bookmarks.set(id, newBookmark);
    return newBookmark;
  }

  async updateBookmark(id: string, updates: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) return undefined;
    
    const updated = { 
      ...bookmark, 
      ...updates,
      updatedAt: new Date(),
    };
    this.bookmarks.set(id, updated);
    return updated;
  }

  async deleteBookmark(id: string): Promise<boolean> {
    return this.bookmarks.delete(id);
  }

  async searchBookmarks(userId: string, query: string): Promise<Bookmark[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.bookmarks.values())
      .filter(bookmark => {
        if (bookmark.userId !== userId) return false;
        return (
          bookmark.title.toLowerCase().includes(lowerQuery) ||
          bookmark.description?.toLowerCase().includes(lowerQuery) ||
          bookmark.url.toLowerCase().includes(lowerQuery) ||
          bookmark.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      })
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async getPinnedBookmarks(userId: string): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId && bookmark.isPinned)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async getRecentBookmarks(userId: string, limit: number = 10): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
