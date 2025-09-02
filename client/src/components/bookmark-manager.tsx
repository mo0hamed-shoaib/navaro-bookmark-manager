import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Search, 
  Plus, 
  Grid3X3, 
  List, 
  LayoutGrid, 
  Palette, 
  Settings, 
  Bookmark as BookmarkIcon, 
  MoreHorizontal,
  Pin,
  Edit,
  ExternalLink,
  Copy,
  Trash,
  ChevronRight,
  CheckSquare,
  Clock,
  X,
  Download,
  Upload,
  Folder,
  Home,
  Briefcase,
  Heart,
  Star,
  Zap,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger, ContextMenuItem } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { themes, themeNames } from "@/lib/themes";
import { apiRequest } from "@/lib/queryClient";
import type { Space, Collection, Bookmark, Share } from "@shared/schema";
import { workspaceManager } from "@/lib/workspace";
import { BookmarkSidebar } from "@/components/bookmark-sidebar";
import { AddSpaceDialog } from "@/components/add-space-dialog";
import { AddCollectionDialog } from "@/components/add-collection-dialog";
import { EditSpaceDialog } from "@/components/edit-space-dialog";
import { EditCollectionDialog } from "@/components/edit-collection-dialog";

import { ShareDialog } from "@/components/share-dialog";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SortableBookmark } from "@/components/sortable-bookmark";
import { EditingToggle } from "@/components/editing-toggle";
import { useEditingGuard } from "@/hooks/use-editing-guard";

// Favicon component with fallback
const Favicon = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback to Google's favicon service
      try {
        const url = new URL(src);
        const fallbackSrc = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
        setImgSrc(fallbackSrc);
      } catch (error) {
        // If URL parsing fails, use a default favicon
        setImgSrc("https://www.google.com/s2/favicons?domain=example.com&sz=32");
      }
    }
  };

  return (
    <img 
      src={imgSrc} 
      alt={alt} 
      className={className}
      onError={handleError}
    />
  );
};

const bookmarkFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Please enter a valid URL"),
  description: z.string().optional(),
  tags: z.string().optional(),
  collectionId: z.string().optional(),
  previewImage: z.string().optional(),
  previewMode: z.enum(["auto", "manual"]).default("auto"),
});

type ViewMode = "grid" | "list" | "compact" | "grid2";

// Custom hook for performance monitoring
function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log performance data in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${duration.toFixed(2)}ms`);
      }
    };
  });
}

// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function BookmarkManager() {
  // Performance monitoring
  usePerformanceMonitor("BookmarkManager");
  
  // View and display state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<"date" | "name" | "visits" | "custom">("date");
  const [isAllBookmarksView, setIsAllBookmarksView] = useState(true);
  
  // Search and command palette state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Dialog states
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);
  const [addSpaceOpen, setAddSpaceOpen] = useState(false);
  const [addCollectionOpen, setAddCollectionOpen] = useState(false);
  const [editSpaceOpen, setEditSpaceOpen] = useState(false);
  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [editBookmarkOpen, setEditBookmarkOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sharesOpen, setSharesOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);
  
  // Selection and navigation state
  const [selectedSpace, setSelectedSpace] = useState<string | undefined>();
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  
  // Data state
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const { guardAction } = useEditingGuard();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize workspace on component mount
  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        // Reset to default workspace to get sample data
        workspaceManager.resetToDefaultWorkspace();
        const workspaceId = await workspaceManager.getOrCreateWorkspace();
        setCurrentWorkspaceId(workspaceId);
      } catch (error) {
        console.error('Failed to initialize workspace:', error);
      }
    };

    initializeWorkspace();
  }, []);

  // Fetch spaces for the current workspace
  const { data: spaces = [], isLoading: isLoadingSpaces } = useQuery<Space[]>({
    queryKey: ["/api/spaces", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const response = await fetch(`/api/spaces?workspaceId=${currentWorkspaceId}`);
      if (!response.ok) throw new Error("Failed to fetch spaces");
      return response.json();
    },
    enabled: !!currentWorkspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Auto-select first space when spaces are loaded
  useEffect(() => {
    if (spaces.length > 0 && !selectedSpace && !isAllBookmarksView) {
      setSelectedSpace(spaces[0].id);
      setExpandedSpaces(new Set([spaces[0].id]));
    }
  }, [spaces, selectedSpace, isAllBookmarksView]);



  // Fetch all collections for the current workspace
  const { data: collections = [], isLoading: isLoadingCollections } = useQuery<Collection[]>({
    queryKey: ["/api/collections", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId || !spaces.length) return [];
      
      // Fetch collections for each space individually
      const allCollections: Collection[] = [];
      for (const space of spaces) {
        try {
          const response = await fetch(`/api/collections?spaceId=${space.id}`);
          if (response.ok) {
            const spaceCollections = await response.json();
            allCollections.push(...spaceCollections);
          }
        } catch (error) {
          console.error(`Error fetching collections for space ${space.id}:`, error);
        }
      }
      
      return allCollections;
    },
    enabled: !!currentWorkspaceId && spaces.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get all bookmarks for sidebar counts (optimized with caching)
  const { data: allBookmarks = [] } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks", "all"],
    queryFn: async () => {
      const response = await fetch(`/api/bookmarks`);
      if (!response.ok) throw new Error("Failed to fetch bookmarks");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });



  // Get filtered bookmarks for current view
  const { data: bookmarks = [] } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks", selectedSpace, selectedCollection],
    queryFn: async () => {
      let url = "/api/bookmarks";
      if (selectedCollection) {
        url = `/api/bookmarks?collectionId=${selectedCollection}`;
      } else if (selectedSpace) {
        url = `/api/bookmarks?spaceId=${selectedSpace}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch bookmarks");
      return response.json();
    },
  });

  // Get current collection for adaptive view mode
  const selectedCollectionData = collections.find(c => c.id === selectedCollection);
  
  // Use collection's view mode if available, otherwise use global view mode
  const effectiveViewMode = selectedCollectionData?.viewMode as ViewMode || viewMode;

  // Function to update collection view mode
  const updateCollectionViewMode = async (collectionId: string, newViewMode: ViewMode) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          viewMode: newViewMode
        }),
      });
      
      if (response.ok) {
        // Refresh collections to get updated view mode
        queryClient.invalidateQueries({ queryKey: ["/api/collections", currentWorkspaceId] });
      } else {
        console.error('Failed to update collection view mode');
      }
    } catch (error) {
      console.error('Error updating collection view mode:', error);
    }
  };

  const { data: pinnedBookmarks = [] } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks/pinned"],
  });

  const { data: recentBookmarks = [] } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks/recent"],
  });



  // Share queries
  const { data: shares = [], isLoading: isLoadingShares } = useQuery<Share[]>({
    queryKey: ["/api/shares", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) {
        console.log("🔍 Shares query: No workspace ID, returning empty array");
        return [];
      }
      const response = await fetch(`/api/shares?workspaceId=${currentWorkspaceId}`);
      if (!response.ok) throw new Error("Failed to fetch shares");
      return response.json();
    },
    enabled: !!currentWorkspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });



  const createBookmarkMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bookmarkFormSchema>) => {
      const tags = data.tags ? data.tags.split(",").map(tag => tag.trim()).filter(Boolean) : [];
      
      // Extract favicon and preview data from URL
      let favicon = null;
      let preview = null;
      
      try {
        const url = new URL(data.url);
        // Generate favicon URL - try multiple common favicon locations
        const faviconUrls = [
          `${url.protocol}//${url.hostname}/favicon.ico`,
          `${url.protocol}//${url.hostname}/apple-touch-icon.png`,
          `${url.protocol}//${url.hostname}/apple-touch-icon-precomposed.png`,
          `${url.protocol}//${url.hostname}/icon.png`
        ];
        
        // Use the first favicon URL as default
        favicon = faviconUrls[0];
        
        // Handle preview based on mode
        if (data.previewMode === "auto") {
          // Try to fetch basic preview data
          const response = await fetch(`/api/bookmark-preview?url=${encodeURIComponent(data.url)}`);
          if (response.ok) {
            const previewData = await response.json();
            preview = previewData;
          }
        } else if (data.previewMode === "manual" && data.previewImage) {
          // Use manual preview image
          preview = {
            title: data.title,
            description: data.description || `Visit ${url.hostname}`,
            image: data.previewImage
          };
        }
      } catch (error) {
        console.log('Could not extract favicon/preview:', error);
      }
      
      const bookmarkData = { 
        ...data, 
        tags,
        favicon,
        preview
      };
      return apiRequest("POST", "/api/bookmarks", bookmarkData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks/recent"] });
      setAddBookmarkOpen(false);
      form.reset({
        title: "",
        url: "",
        description: "",
        tags: "",
        collectionId: "",
        previewImage: "",
        previewMode: "auto"
      });
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof bookmarkFormSchema> }) => {
      const tags = data.tags ? data.tags.split(",").map(tag => tag.trim()).filter(Boolean) : [];
      
      // Handle preview based on mode
      let preview = null;
      
      if (data.previewMode === "manual" && data.previewImage) {
        // Use manual preview image
        preview = {
          title: data.title,
          description: data.description || `Visit ${new URL(data.url).hostname}`,
          image: data.previewImage
        };
      } else if (data.previewMode === "auto") {
        // Try to fetch basic preview data
        try {
          const response = await fetch(`/api/bookmark-preview?url=${encodeURIComponent(data.url)}`);
          if (response.ok) {
            const previewData = await response.json();
            preview = previewData;
          }
        } catch (error) {
          console.log('Could not extract preview:', error);
        }
      }
      
      const bookmarkData = { 
        ...data, 
        tags,
        preview
      };
      return apiRequest("PUT", `/api/bookmarks/${id}`, bookmarkData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks/recent"] });
      setEditBookmarkOpen(false);
      setEditingBookmark(null);
    },
  });

  const pinBookmarkMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Bookmark> }) => {
      return apiRequest("PUT", `/api/bookmarks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks/pinned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks/recent"] });
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/bookmarks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks/pinned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks/recent"] });
    },
  });

  const reorderBookmarksMutation = useMutation({
    mutationFn: async ({ collectionId, bookmarkIds }: { collectionId: string; bookmarkIds: string[] }) => {
      return apiRequest("POST", "/api/bookmarks/reorder", { collectionId, bookmarkIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
  });

  // Space and Collection mutations
  const createSpaceMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; icon: string }) => {
      return apiRequest("POST", "/api/spaces", {
        ...data,
        workspaceId: currentWorkspaceId,
        orderIndex: "0"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
    },
  });

  const createCollectionMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; icon: string; spaceId: string }) => {
      return apiRequest("POST", "/api/collections", {
        ...data,
        orderIndex: "0",
        viewMode: "card"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
  });

  // Update and Delete mutations
  const updateSpaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string; icon: string } }) => {
      return apiRequest("PUT", `/api/spaces/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      setEditSpaceOpen(false);
    },
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/spaces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      setEditSpaceOpen(false);
      setSelectedSpace(undefined);
      setSelectedCollection(undefined);
    },
  });

  const updateCollectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string; icon: string } }) => {
      return apiRequest("PUT", `/api/collections/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      setEditCollectionOpen(false);
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/collections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      setEditCollectionOpen(false);
      setSelectedCollection(undefined);
    },
  });

  // Session mutations


  // Share mutations
  const createShareMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; expiresAt?: Date }) => {
      if (!currentWorkspaceId) throw new Error("No workspace ID");
      return apiRequest("POST", "/api/shares", {
        workspaceId: currentWorkspaceId,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shares", currentWorkspaceId] });
    },
  });

  const deleteShareMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/shares/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shares", currentWorkspaceId] });
    },
  });

  const form = useForm<z.infer<typeof bookmarkFormSchema>>({
    resolver: zodResolver(bookmarkFormSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      tags: "",
      collectionId: "",
      previewImage: "",
      previewMode: "auto",
    },
  });

  const currentCollection = collections.find(c => c.id === selectedCollection);
  const currentSpace = spaces.find(s => s.id === selectedSpace);

  // Context-aware settings handler
  const handleContextSettings = () => {
    if (selectedCollection && currentCollection) {
      // Edit collection
      setEditCollectionOpen(true);
    } else if (selectedSpace && currentSpace) {
      // Edit space
      setEditSpaceOpen(true);
    } else {
      // Global settings (fallback)
      setSettingsOpen(true);
    }
  };

  // ===== UTILITY FUNCTIONS =====
  
  // Helper function to get icon component based on icon name
  const getIconComponent = (iconName?: string | null) => {
    // Handle null/undefined case
    if (!iconName) {
      return Folder;
    }
    
    switch (iconName) {
      case 'home': return Home;
      case 'briefcase': return Briefcase;
      case 'heart': return Heart;
      case 'star': return Star;
      case 'zap': return Zap;
      case 'target': return Target;
      case 'bookmark': return BookmarkIcon;
      case 'clock': return Clock;
      default: return Folder;
    }
  };

  // ===== COMMAND PALETTE FUNCTIONS =====
  
  // Command palette parsing and execution
  const parseCommand = (query: string) => {
    const trimmed = query.trim();
    
    // Command patterns
    if (trimmed.startsWith('>')) {
      return { type: 'command', command: trimmed.slice(1).toLowerCase() };
    }
    
    if (trimmed.startsWith('@')) {
      return { type: 'navigation', target: trimmed.slice(1).toLowerCase() };
    }
    
    // Default to search
    return { type: 'search', query: trimmed };
  };

  const executeCommand = (command: string) => {
    const parsed = parseCommand(command);
    
    switch (parsed.type) {
      case 'command':
        switch (parsed.command) {
          case 'add bookmark':
          case 'add':
          case 'new bookmark':
            setAddBookmarkOpen(true);
            setSearchOpen(false);
            break;
          case 'new collection':
          case 'add collection':
            setAddCollectionOpen(true);
            setSearchOpen(false);
            break;
          case 'new space':
          case 'add space':
            setAddSpaceOpen(true);
            setSearchOpen(false);
            break;
          case 'export':
            exportData();
            setSearchOpen(false);
            break;
          case 'import':
            setImportExportOpen(true);
            setSearchOpen(false);
            break;
          case 'share':
            setSharesOpen(true);
            setSearchOpen(false);
            break;
          case 'settings':
            setSettingsOpen(true);
            setSearchOpen(false);
            break;
          default:
            // Unknown command - treat as search
            return false;
        }
        return true;
        
      case 'navigation':
        // Navigate to space or collection
        const target = parsed.target;
        
        // Early return if target is undefined
        if (!target) {
          return false;
        }
        
        const space = spaces.find(s => s.name.toLowerCase().includes(target));
        const collection = collections.find(c => c.name.toLowerCase().includes(target));
        
        if (space) {
          setSelectedSpace(space.id);
          setSelectedCollection(undefined);
          setSearchOpen(false);
          return true;
        }
        
        if (collection) {
          // Set the parent space for the collection
          setSelectedSpace(collection.spaceId);
          setSelectedCollection(collection.id);
          setIsAllBookmarksView(false);
          setSearchOpen(false);
          return true;
        }
        
        if (target === 'all' || target === 'home') {
          setIsAllBookmarksView(true);
          setSelectedSpace(undefined);
          setSelectedCollection(undefined);
          setSearchOpen(false);
          return true;
        }
        
        return false;
        
      default:
        return false;
    }
  };

  // ===== BOOKMARK MANAGEMENT FUNCTIONS =====
  
  // Filter and sort bookmarks based on selected space, collection, and sort option
  const filteredBookmarks = React.useMemo(() => {
    let sortedBookmarks = [...(bookmarks || [])];
    
    // Sort bookmarks based on the selected sort option
    switch (sortBy) {
      case 'date':
        sortedBookmarks.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'name':
        sortedBookmarks.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'visits':
        // For now, we'll sort by updatedAt as a proxy for visits since we don't have visit tracking yet
        sortedBookmarks.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'custom':
        // Use orderIndex for custom sorting (manual organization)
        sortedBookmarks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        break;
    }
    
    return sortedBookmarks;
  }, [bookmarks, sortBy]);

  // Memoized search results for better performance
  const searchResults = React.useMemo(() => {
    if (!debouncedSearchQuery.trim()) return [];
    
    return allBookmarks
      .filter(bookmark => {
        const queryLower = debouncedSearchQuery.toLowerCase();
        return bookmark.title.toLowerCase().includes(queryLower) ||
               bookmark.url.toLowerCase().includes(queryLower) ||
               bookmark.description?.toLowerCase().includes(queryLower) ||
               (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(queryLower)));
      })
      .slice(0, 10);
  }, [allBookmarks, debouncedSearchQuery]);

  const togglePin = (bookmark: Bookmark) => {
    guardAction('pin bookmark', () => {
      pinBookmarkMutation.mutate({
        id: bookmark.id,
        updates: { isPinned: !bookmark.isPinned },
      });
    });
  };

  const deleteBookmark = (id: string) => {
    deleteBookmarkMutation.mutate(id);
  };

  const reorderBookmarks = (bookmarkIds: string[]) => {
    // Determine the collection ID from the first bookmark
    if (bookmarkIds.length === 0) return;
    
    const firstBookmark = filteredBookmarks.find(b => b.id === bookmarkIds[0]);
    if (!firstBookmark) return;
    
    const collectionId = firstBookmark.collectionId;
    if (!collectionId) return;
    
    // Set sort to custom when reordering
    setSortBy('custom');
    
    reorderBookmarksMutation.mutate({
      collectionId,
      bookmarkIds,
    });
  };

  // ===== DRAG AND DROP FUNCTIONS =====
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      guardAction("reorder bookmarks", () => {
        const oldIndex = filteredBookmarks.findIndex(bookmark => bookmark.id === active.id);
        const newIndex = filteredBookmarks.findIndex(bookmark => bookmark.id === over?.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(filteredBookmarks, oldIndex, newIndex);
          const bookmarkIds = newOrder.map(bookmark => bookmark.id);
          reorderBookmarks(bookmarkIds);
        }
      });
    }
  };



  // ===== NAVIGATION AND SELECTION FUNCTIONS =====
  
  const toggleSpaceExpansion = (spaceId: string) => {
    setExpandedSpaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(spaceId)) {
        newSet.delete(spaceId);
      } else {
        newSet.add(spaceId);
      }
      return newSet;
    });
  };

  const isSpaceExpanded = (spaceId: string) => expandedSpaces.has(spaceId);

  const handleSpaceClick = (spaceId: string) => {
    if (spaceId === "") {
      // "All Bookmarks" clicked
      setSelectedSpace(undefined);
      setSelectedCollection(undefined);
      setIsAllBookmarksView(true);
      return;
    }
    
    // Toggle expansion when clicking the space
    toggleSpaceExpansion(spaceId);
    // Select the space
    setSelectedSpace(spaceId);
    setSelectedCollection(undefined);
    setIsAllBookmarksView(false);
  };

  const handleHomeClick = () => {
    setSelectedSpace(undefined);
    setSelectedCollection(undefined);
    setIsAllBookmarksView(true);
    setSearchQuery(""); // Clear search when going home
  };

  const toggleSelectBookmark = (id: string) => {
    const newSelected = new Set(selectedBookmarks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBookmarks(newSelected);
  };

  const selectAllBookmarks = () => {
    guardAction("select bookmarks", () => {
      if (selectedBookmarks.size === filteredBookmarks.length) {
        setSelectedBookmarks(new Set());
      } else {
        setSelectedBookmarks(new Set(filteredBookmarks.map(b => b.id)));
      }
    });
  };

  // ===== IMPORT/EXPORT FUNCTIONS =====
  
  const exportData = () => {
    console.log('Export button clicked');
    console.log('Spaces:', spaces);
    console.log('Collections:', collections);
    console.log('All bookmarks:', allBookmarks);
    
    // Prepare collections with space information
    const collectionsWithSpace = collections.map(collection => ({
      ...collection,
      spaceName: spaces.find(s => s.id === collection.spaceId)?.name || "Unknown Space"
    }));

    // Prepare bookmarks with collection information
    const bookmarksWithCollection = allBookmarks.map(bookmark => ({
      ...bookmark,
      collectionName: collections.find(c => c.id === bookmark.collectionId)?.name || "Unknown Collection"
    }));

    const exportData = {
      spaces,
      collections: collectionsWithSpace,
      bookmarks: bookmarksWithCollection,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    
    console.log('Export data prepared:', exportData);
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Export completed');
  };

  const importData = async (file: File) => {
    console.log('Import started with file:', file.name);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      console.log('Parsed import data:', data);
      
      // Validate the import data structure
      if (!data.spaces || !data.collections || !data.bookmarks) {
        throw new Error('Invalid import file format');
      }
      
      if (!currentWorkspaceId) {
        throw new Error('No workspace available for import');
      }
      
      // Send import data to backend
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: currentWorkspaceId,
          importData: data
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }
      
      const result = await response.json();
      
      // Refresh all data
      queryClient.invalidateQueries({ queryKey: ["/api/spaces", currentWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections", currentWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      
      alert(`Import completed successfully!\nImported: ${result.imported.spaces} spaces, ${result.imported.collections} collections, ${result.imported.bookmarks} bookmarks`);
      
    } catch (error) {
      console.error('Import error:', error);
      alert(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };



  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset form when opening edit dialog with bookmark data
  useEffect(() => {
    if (editBookmarkOpen && editingBookmark) {
      form.reset({
        title: editingBookmark.title,
        url: editingBookmark.url,
        description: editingBookmark.description || "",
        collectionId: editingBookmark.collectionId || "",
        tags: editingBookmark.tags?.join(", ") || "",
        previewImage: editingBookmark.preview?.image || "",
        previewMode: editingBookmark.preview?.image ? "manual" : "auto",
      });
    }
  }, [editBookmarkOpen, editingBookmark, form]);

  return (
    <div className="overflow-x-hidden min-h-screen">
    <SidebarProvider>
      <BookmarkSidebar
        spaces={spaces}
        collections={collections}
        bookmarks={bookmarks}
        allBookmarks={allBookmarks}
        pinnedBookmarks={pinnedBookmarks}
        recentBookmarks={recentBookmarks}
        selectedSpace={selectedSpace}
        selectedCollection={selectedCollection}
        isAllBookmarksView={isAllBookmarksView}
        expandedSpaces={expandedSpaces}
        onSpaceClick={handleSpaceClick}
        onCollectionClick={(collectionId) => {
          setSelectedCollection(collectionId);
          setIsAllBookmarksView(false);
        }}
        onToggleSpaceExpansion={toggleSpaceExpansion}
        onAddBookmark={() => setAddBookmarkOpen(true)}
                        onAddSpace={() => guardAction("add space", () => setAddSpaceOpen(true))}
        onAddCollection={(spaceId) => {
          // When adding collection from space context menu, pre-select that space
          guardAction("add collection", () => {
            if (spaceId) {
              setSelectedSpace(spaceId);
            }
            setAddCollectionOpen(true);
          });
        }}
        onEditSpace={(spaceId) => {
          guardAction("edit space", () => {
            setSelectedSpace(spaceId);
            setEditSpaceOpen(true);
          });
        }}
        onEditCollection={(collectionId) => {
          guardAction("edit collection", () => {
            setSelectedCollection(collectionId);
            setEditCollectionOpen(true);
          });
        }}
        onDeleteSpace={(spaceId) => {
          guardAction("delete space", () => {
            if (confirm(`Are you sure you want to delete this space? This will also delete all collections and bookmarks within it.`)) {
              deleteSpaceMutation.mutate(spaceId);
            }
          });
        }}
        onDeleteCollection={(collectionId) => {
          guardAction("delete collection", () => {
            if (confirm(`Are you sure you want to delete this collection? This will also delete all bookmarks within it.`)) {
              deleteCollectionMutation.mutate(collectionId);
            }
          });
        }}
        onSearch={() => {
          setSearchQuery(""); // Clear any existing search
          setSearchOpen(true);
        }}

        onShares={() => setSharesOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        currentWorkspaceId={currentWorkspaceId}
        isLoadingSpaces={isLoadingSpaces}
        isLoadingCollections={isLoadingCollections}
      />

      <SidebarInset className="overflow-x-hidden">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center w-full min-w-0 px-2 sm:px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                              {/* Left section: Sidebar trigger + Breadcrumbs (Desktop) */}
          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
            <SidebarTrigger className="-ml-1 flex-shrink-0" />
            <div className="h-4 w-px bg-border flex-shrink-0 hidden sm:block" />
            {/* Breadcrumbs - Desktop Only */}
            <nav className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground min-w-0">
              <button 
                onClick={handleHomeClick}
                className="hover:text-foreground transition-colors cursor-pointer hover:underline flex-shrink-0"
                title="Go to All Bookmarks"
              >
                Home
              </button>
              {currentSpace && (
                <>
                  <span className="flex-shrink-0">/</span>
                  <button 
                  onClick={() => {
                      setSelectedSpace(currentSpace.id);
                      setSelectedCollection(undefined);
                    }}
                    className="hover:text-foreground transition-colors cursor-pointer hover:underline truncate min-w-0"
                    title={`Go to ${currentSpace.name}`}
                  >
                    {currentSpace.name}
                  </button>
                </>
              )}
              {currentCollection && (
                <>
              <span className="flex-shrink-0">/</span>
              <span className="text-foreground font-medium truncate min-w-0">
                    {currentCollection.name}
              </span>
                </>
              )}
              {!currentSpace && !currentCollection && (
                <span className="text-foreground font-medium">All Bookmarks</span>
              )}
            </nav>
          </div>

          {/* Center section: Search Bar */}
          <div className="flex-1 flex justify-center px-2 sm:px-4 md:px-8 min-w-0">
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 flex-shrink-0" />
              <Input
                placeholder="Search..."
                className="pl-10 w-full"
                onClick={() => setSearchOpen(true)}
                readOnly
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Right section: Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            {/* View Mode Toggle - Desktop */}
            <div className="hidden md:flex items-center bg-muted rounded-md p-1">
                <Button
                variant={effectiveViewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  if (selectedCollectionData) {
                    updateCollectionViewMode(selectedCollectionData.id, "grid");
                  } else {
                    setViewMode("grid");
                  }
                }}
                data-testid="button-view-grid"
                title="Grid View"
              >
                <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                variant={effectiveViewMode === "grid2" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  if (selectedCollectionData) {
                    updateCollectionViewMode(selectedCollectionData.id, "grid2");
                  } else {
                    setViewMode("grid2");
                  }
                }}
                data-testid="button-view-grid2"
                title="2-Column Grid"
              >
                <LayoutGrid className="h-4 w-4" />
                </Button>
              <Button
                variant={effectiveViewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  if (selectedCollectionData) {
                    updateCollectionViewMode(selectedCollectionData.id, "list");
                  } else {
                    setViewMode("list");
                  }
                }}
                data-testid="button-view-list"
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
                  <Button
                variant={effectiveViewMode === "compact" ? "default" : "ghost"}
                      size="sm"
                onClick={() => {
                  if (selectedCollectionData) {
                    updateCollectionViewMode(selectedCollectionData.id, "compact");
                  } else {
                    setViewMode("compact");
                  }
                }}
                data-testid="button-view-compact"
                title="Compact View"
              >
                <LayoutGrid className="h-4 w-4" />
                    </Button>
        </div>

            {/* View Mode Toggle - Mobile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" title="View Mode">
                  {effectiveViewMode === "grid" && <Grid3X3 className="h-4 w-4" />}
                  {effectiveViewMode === "grid2" && <LayoutGrid className="h-4 w-4" />}
                  {effectiveViewMode === "list" && <List className="h-4 w-4" />}
                  {effectiveViewMode === "compact" && <LayoutGrid className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    if (selectedCollectionData) {
                      updateCollectionViewMode(selectedCollectionData.id, "grid");
                    } else {
                      setViewMode("grid");
                    }
                  }}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grid View
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (selectedCollectionData) {
                      updateCollectionViewMode(selectedCollectionData.id, "grid2");
                    } else {
                      setViewMode("grid2");
                    }
                  }}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  2-Column Grid
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (selectedCollectionData) {
                      updateCollectionViewMode(selectedCollectionData.id, "list");
                    } else {
                      setViewMode("list");
                    }
                  }}
                >
                  <List className="h-4 w-4 mr-2" />
                  List View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (selectedCollectionData) {
                      updateCollectionViewMode(selectedCollectionData.id, "compact");
                    } else {
                      setViewMode("compact");
                    }
                  }}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Compact View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Bookmark */}
            <Button 
              onClick={() => guardAction("add bookmark", () => setAddBookmarkOpen(true))} 
              data-testid="button-add-bookmark-header"
              size="sm" 
              className="flex-shrink-0"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Bookmark</span>
            </Button>

            {/* More Actions Dropdown - Mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="sm:hidden">
                <Button variant="ghost" size="sm" title="More Actions">
                  <MoreHorizontal className="h-4 w-4" />
              </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {themeNames.map((themeName) => {
                  const themeDisplayName = themes[themeName]?.name || themeName;
                  return (
                    <DropdownMenuItem
                      key={themeName}
                      onClick={() => setTheme(themeName)}
                    >
                      <div className={cn(
                        "w-3 h-3 rounded-full mr-2",
                        themeName === "highlighter" && "bg-gradient-to-r from-green-400 to-purple-400",
                        themeName === "zen-garden" && "bg-gradient-to-r from-green-300 to-purple-300",
                        themeName === "honey" && "bg-gradient-to-r from-yellow-400 to-orange-500",
                        themeName === "nomad" && "bg-gradient-to-r from-red-500 to-gray-400",
                        themeName === "quadratic" && "bg-gradient-to-r from-gray-900 to-white"
                      )} />
                      {themeDisplayName}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Switcher - Desktop */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="hidden sm:flex">
                <Button variant="ghost" size="sm" data-testid="button-theme-switcher" title="Switch Theme">
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {themeNames.map((themeName) => {
                  const themeDisplayName = themes[themeName]?.name || themeName;
                  return (
                    <DropdownMenuItem
                      key={themeName}
                      onClick={() => setTheme(themeName)}
                      className="flex items-center space-x-2"
                      data-testid={`button-theme-${themeName}`}
                    >
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        themeName === "highlighter" && "bg-gradient-to-r from-green-400 to-purple-400",
                        themeName === "zen-garden" && "bg-gradient-to-r from-green-300 to-purple-300",
                        themeName === "honey" && "bg-gradient-to-r from-yellow-400 to-orange-500",
                        themeName === "nomad" && "bg-gradient-to-r from-red-500 to-gray-400",
                        themeName === "quadratic" && "bg-gradient-to-r from-gray-900 to-white"
                      )} />
                      <span>{themeDisplayName}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Editing Toggle */}
            <EditingToggle />


          </div>
        </header>

        {/* Breadcrumbs - Mobile Only */}
        <div className="px-3 sm:px-4 md:px-6 py-2 border-b bg-muted/30 sm:hidden">
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground min-w-0">
            <button 
              onClick={handleHomeClick}
              className="hover:text-foreground transition-colors cursor-pointer hover:underline flex-shrink-0"
              title="Go to All Bookmarks"
            >
              🏠
            </button>
            {currentSpace && (
              <>
                <span className="flex-shrink-0">/</span>
                <button 
                onClick={() => {
                    setSelectedSpace(currentSpace.id);
                    setSelectedCollection(undefined);
                  }}
                  className="hover:text-foreground transition-colors cursor-pointer hover:underline truncate min-w-0"
                  title={`Go to ${currentSpace.name}`}
                >
                  {currentSpace.name.slice(0, 8)}...
                </button>
              </>
            )}
            {currentCollection && (
              <>
            <span className="flex-shrink-0">/</span>
            <span className="text-foreground font-medium truncate min-w-0">
                  {currentCollection.name.slice(0, 8)}...
            </span>
              </>
            )}
            {!currentSpace && !currentCollection && (
              <span className="text-foreground font-medium">All</span>
            )}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:px-4 md:px-6 py-4 md:py-6">
          {/* Collection Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {isAllBookmarksView ? "All Bookmarks" : currentCollection?.name || currentSpace?.name || "All Bookmarks"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isAllBookmarksView ? "All your bookmarks in one place" : currentCollection?.description || currentSpace?.description || "All your bookmarks in one place"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {filteredBookmarks.length} bookmarks
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => guardAction("edit settings", handleContextSettings)}
                  data-testid="button-collection-settings"
                  title={selectedCollection ? "Edit Collection" : selectedSpace ? "Edit Space" : "Settings"}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => guardAction("select bookmarks", selectAllBookmarks)}
                  data-testid="button-select-all"
                  className="flex-shrink-0"
                >
                  <CheckSquare className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {selectedBookmarks.size === filteredBookmarks.length ? "Deselect All" : "Select All"}
                  </span>
                </Button>

                {selectedBookmarks.size > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {selectedBookmarks.size} selected
                    </span>
                    <Button size="sm" variant="secondary" data-testid="button-bulk-move" className="flex-shrink-0">
                      Move
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        selectedBookmarks.forEach(id => deleteBookmark(id));
                        setSelectedBookmarks(new Set());
                      }}
                      data-testid="button-bulk-delete"
                      className="flex-shrink-0"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              <Select value={sortBy} onValueChange={(value: "date" | "name" | "visits" | "custom") => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-48 min-w-0" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date Added</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="visits">Sort by Most Visited</SelectItem>
                  <SelectItem value="custom">Custom Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bookmark Grid */}
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <BookmarkIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No bookmarks yet</h3>
              <p className="text-muted-foreground mb-4">Start building your collection by adding your first bookmark</p>
              <Button onClick={() => setAddBookmarkOpen(true)} data-testid="button-add-first-bookmark">
                Add Your First Bookmark
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredBookmarks.map(bookmark => bookmark.id)}
                strategy={
                  effectiveViewMode === "list" 
                    ? verticalListSortingStrategy 
                    : horizontalListSortingStrategy
                }
              >
            <div className={cn(
              "gap-4",
                  effectiveViewMode === "grid" && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                  effectiveViewMode === "grid2" && "grid grid-cols-1 md:grid-cols-2",
                  effectiveViewMode === "list" && "flex flex-col space-y-3",
                  effectiveViewMode === "compact" && "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
                )}>
                  {filteredBookmarks.map((bookmark) => (
                    <SortableBookmark
                      key={bookmark.id}
                      bookmark={bookmark}
                      viewMode={effectiveViewMode}
                      isSelected={selectedBookmarks.has(bookmark.id)}
                      onToggleSelect={toggleSelectBookmark}
                      onEdit={(bookmark) => {
                        guardAction("edit bookmark", () => {
                          setEditingBookmark(bookmark);
                          setEditBookmarkOpen(true);
                        });
                      }}
                      onDelete={(bookmarkId) => {
                        guardAction("delete bookmark", () => deleteBookmark(bookmarkId));
                      }}
                      onPin={togglePin}
                      onCopyUrl={(url) => {
                        navigator.clipboard.writeText(url);
                      }}
                      onOpenUrl={(url) => {
                        window.open(url, "_blank");
                      }}
                    />
                  ))}
                                  </div>
              </SortableContext>
            </DndContext>
                                )}
                              </div>
      </SidebarInset>

      {/* Enhanced Command Palette */}
      <CommandDialog 
        open={searchOpen} 
        onOpenChange={(open) => {
          setSearchOpen(open);
          if (!open) {
            setSearchQuery(""); // Clear search when closing dialog
          }
        }}
      >
        <CommandInput 
          placeholder="Search bookmarks, use >commands, or @navigate..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              const success = executeCommand(searchQuery);
              if (success) {
                setSearchQuery("");
              }
            }
          }}
        />
        <CommandList>
          {(() => {
            const query = searchQuery.trim();
            
            if (!query) {
              return (
                <div className="p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</div>
                  <div className="space-y-2">
                    <div className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                         onClick={() => setSearchQuery(">add bookmark")}>
                      <Plus className="w-4 h-4 mr-2" />
                      <span>Add Bookmark</span>
                                             <span className="ml-auto text-xs text-muted-foreground">{'>'}add</span>
                              </div>
                    <div className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                         onClick={() => setSearchQuery(">new collection")}>
                      <Folder className="w-4 h-4 mr-2" />
                      <span>New Collection</span>
                      <span className="ml-auto text-xs text-muted-foreground">{'>'}new collection</span>
                            </div>
                    <div className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                         onClick={() => setSearchQuery(">export")}>
                      <Download className="w-4 h-4 mr-2" />
                      <span>Export Data</span>
                      <span className="ml-auto text-xs text-muted-foreground">{'>'}export</span>
                          </div>
                    <div className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                         onClick={() => setSearchQuery(">share")}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      <span>Share Workspace</span>
                      <span className="ml-auto text-xs text-muted-foreground">{'>'}share</span>
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium text-muted-foreground mb-3 mt-4">Navigation</div>
                  <div className="space-y-2">
                    <div className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                         onClick={() => setSearchQuery("@all")}>
                      <Home className="w-4 h-4 mr-2" />
                      <span>All Bookmarks</span>
                      <span className="ml-auto text-xs text-muted-foreground">@all</span>
                            </div>
                    {spaces.slice(0, 3).map((space) => (
                      <div key={space.id} 
                           className="flex items-center px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                           onClick={() => setSearchQuery(`@${space.name.toLowerCase()}`)}>
                        {React.createElement(getIconComponent(space.icon), { className: "w-4 h-4 mr-2" })}
                        <span>{space.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">@{space.name.toLowerCase()}</span>
                      </div>
                    ))}
                              </div>
                            </div>
              );
            }
            
            // Parse command
            const parsed = parseCommand(query);
            
            // Handle commands
            if (parsed.type === 'command') {
              const command = parsed.command;
              
              // Early return if command is undefined
              if (!command) {
                return null;
              }
              
              const suggestions = [
                { cmd: 'add bookmark', label: 'Add Bookmark', icon: Plus },
                { cmd: 'new collection', label: 'New Collection', icon: Folder },
                { cmd: 'new space', label: 'New Space', icon: Folder },
                { cmd: 'export', label: 'Export Data', icon: Download },
                { cmd: 'import', label: 'Import Data', icon: Upload },
                { cmd: 'share', label: 'Share Workspace', icon: ExternalLink },
                { cmd: 'settings', label: 'Settings', icon: Settings }
              ].filter(s => s.cmd.includes(command));
              
              if (suggestions.length > 0) {
                return (
                  <div className="p-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Commands</div>
                    {suggestions.map((suggestion, index) => {
                      const IconComponent = suggestion.icon;
                      return (
                        <div
                          key={index}
                          className="flex items-center px-2 py-3 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                          onClick={() => {
                            executeCommand(`>${suggestion.cmd}`);
                            setSearchQuery("");
                          }}
                        >
                          <IconComponent className="w-4 h-4 mr-2" />
                          <span>{suggestion.label}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{'>'}{suggestion.cmd}</span>
                            </div>
                      );
                    })}
                          </div>
                );
              }
            }
            
            // Handle navigation
            if (parsed.type === 'navigation') {
              const target = parsed.target;
              
              // Early return if target is undefined
              if (!target) {
                return null;
              }
              
              const spaceMatches = spaces.filter(s => s.name.toLowerCase().includes(target));
              const collectionMatches = collections.filter(c => c.name.toLowerCase().includes(target));
              const allMatches = [...spaceMatches, ...collectionMatches];
              
              if (allMatches.length > 0) {
                return (
                  <div className="p-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Navigate to</div>
                    {allMatches.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center px-2 py-3 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                      onClick={() => {
                          executeCommand(`@${item.name.toLowerCase()}`);
                          setSearchQuery("");
                        }}
                      >
                        {React.createElement(getIconComponent(item.icon), { className: "w-4 h-4 mr-2" })}
                        <span>{item.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">@{item.name.toLowerCase()}</span>
                      </div>
              ))}
            </div>
                );
              }
            }
            
            // Use memoized search results for better performance
            if (searchResults.length === 0) {
              return <CommandEmpty>No results found.</CommandEmpty>;
            }
            
            const resultsToShow = searchResults;
            
            return (
              <div className="p-2">
                <div className="text-sm font-medium text-muted-foreground mb-2">Bookmarks</div>
                {resultsToShow.map((bookmark) => (
                  <div
                key={bookmark.id}
                    className="flex items-center px-2 py-3 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                    onClick={() => {
                  window.open(bookmark.url, "_blank");
                  setSearchOpen(false);
                      setSearchQuery("");
                }}
                data-testid={`search-result-${bookmark.id}`}
              >
                {bookmark.favicon && (
                      <Favicon src={bookmark.favicon} className="w-4 h-4 rounded mr-2" alt="" />
                )}
                <span>{bookmark.title}</span>
                  </div>
            ))}
              </div>
            );
          })()}
        </CommandList>
      </CommandDialog>

      {/* Add Bookmark Dialog */}
      <Dialog open={addBookmarkOpen} onOpenChange={setAddBookmarkOpen}>
        <DialogContent 
          className="w-[calc(100%-2rem)] max-w-none sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" 
          data-testid="dialog-add-bookmark"
        >
          <DialogHeader>
            <DialogTitle>Add New Bookmark</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit((data) => createBookmarkMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Bookmark title" {...field} data-testid="input-bookmark-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} data-testid="input-bookmark-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description..." {...field} data-testid="textarea-bookmark-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="tag1, tag2, tag3" {...field} data-testid="input-bookmark-tags" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Preview Image Section */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="previewMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Preview Image
                        <span className="text-xs text-muted-foreground">
                          (Auto works for most sites, Manual for blocked sites)
                        </span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-preview-mode">
                            <SelectValue placeholder="Select preview mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto">Auto-extract from website</SelectItem>
                          <SelectItem value="manual">Manual URL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="previewImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preview Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          {...field} 
                          data-testid="input-preview-image"
                          disabled={form.watch("previewMode") === "auto"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="collectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bookmark-collection">
                          <SelectValue placeholder="Select a collection" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddBookmarkOpen(false)}
                  data-testid="button-cancel-bookmark"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createBookmarkMutation.isPending}
                  data-testid="button-save-bookmark"
                >
                  {createBookmarkMutation.isPending ? "Saving..." : "Save Bookmark"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Bookmark Dialog */}
      <Dialog open={editBookmarkOpen} onOpenChange={setEditBookmarkOpen}>
        <DialogContent 
          className="w-[calc(100%-2rem)] max-w-none sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" 
          data-testid="dialog-edit-bookmark"
        >
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                if (editingBookmark) {
                  updateBookmarkMutation.mutate({ id: editingBookmark.id, data });
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Bookmark title" {...field} data-testid="input-edit-bookmark-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} data-testid="input-edit-bookmark-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Optional description"
                        className="min-h-[80px]"
                        {...field}
                        data-testid="textarea-edit-bookmark-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Preview Image Section */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="previewMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Preview Image
                        <span className="text-xs text-muted-foreground">
                          (Auto works for most sites, Manual for blocked sites)
                        </span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-preview-mode">
                            <SelectValue placeholder="Select preview mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto">Auto-extract from website</SelectItem>
                          <SelectItem value="manual">Manual URL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="previewImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preview Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          {...field} 
                          data-testid="input-edit-preview-image"
                          disabled={form.watch("previewMode") === "auto"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="collectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collection</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-bookmark-collection">
                          <SelectValue placeholder="Select a collection" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {collections.map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="tag1, tag2, tag3"
                        {...field}
                        data-testid="input-edit-bookmark-tags"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditBookmarkOpen(false)}
                  data-testid="button-cancel-edit-bookmark"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateBookmarkMutation.isPending}
                  data-testid="button-update-bookmark"
                >
                  {updateBookmarkMutation.isPending ? "Updating..." : "Update Bookmark"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent 
          className="w-[calc(100%-2rem)] max-w-none sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" 
          data-testid="dialog-settings"
        >
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Theme Settings */}
            <div>
              <h3 className="text-lg font-medium mb-4">Appearance</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Theme</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2">
                    {themeNames.map((themeName) => {
                      const themeDisplayName = themes[themeName]?.name || themeName;
                      return (
                        <Button
                          key={themeName}
                          variant={theme === themeName ? "default" : "outline"}
                          className="justify-start h-auto p-2 sm:p-3 text-sm"
                          onClick={() => setTheme(themeName)}
                          data-testid={`settings-theme-${themeName}`}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                            <div className={cn(
                              "w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0",
                              themeName === "highlighter" && "bg-gradient-to-r from-green-400 to-purple-400",
                              themeName === "zen-garden" && "bg-gradient-to-r from-green-300 to-purple-300",
                              themeName === "honey" && "bg-gradient-to-r from-yellow-400 to-orange-500",
                              themeName === "nomad" && "bg-gradient-to-r from-red-500 to-gray-400",
                              themeName === "quadratic" && "bg-gradient-to-r from-gray-900 to-white"
                            )} />
                            <span className="truncate">{themeDisplayName}</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Default View Mode</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="flex-shrink-0"
                    >
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "grid2" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid2")}
                      className="flex-shrink-0"
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      2-Column
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="flex-shrink-0"
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                    <Button
                      variant={viewMode === "compact" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("compact")}
                      className="flex-shrink-0"
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Compact
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div>
              <h3 className="text-lg font-medium mb-4">Data Management</h3>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Export Bookmarks</div>
                    <div className="text-xs text-muted-foreground">Download your bookmarks as JSON</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      console.log('Export button clicked from settings');
                      exportData();
                    }}
                    data-testid="button-export-bookmarks"
                    className="w-full sm:w-auto"
                  >
                    Export
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Import Bookmarks</div>
                    <div className="text-xs text-muted-foreground">Import from JSON file</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          importData(file);
                        }
                      };
                      input.click();
                    }}
                    data-testid="button-import-bookmarks"
                    className="w-full sm:w-auto"
                  >
                    Import
                  </Button>
                </div>
              </div>
            </div>

            {/* About */}
            <div>
              <h3 className="text-lg font-medium mb-4">About</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <div>Navaro Bookmark Manager v1.0</div>
                <div>A modern alternative to browser bookmark management</div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Keyboard Shortcuts
                  </Button>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Privacy Policy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    {/* Add Space Dialog */}
    <AddSpaceDialog
      open={addSpaceOpen}
      onOpenChange={setAddSpaceOpen}
      onSubmit={createSpaceMutation.mutate}
      currentWorkspaceId={currentWorkspaceId}
    />

    {/* Add Collection Dialog */}
    <AddCollectionDialog
      open={addCollectionOpen}
      onOpenChange={setAddCollectionOpen}
      onSubmit={createCollectionMutation.mutate}
      spaces={spaces}
      selectedSpaceId={selectedSpace}
    />

    {/* Edit Space Dialog */}
    <EditSpaceDialog
      open={editSpaceOpen}
      onOpenChange={setEditSpaceOpen}
      onSubmit={(data) => updateSpaceMutation.mutate({ id: selectedSpace!, data })}
      onDelete={() => deleteSpaceMutation.mutate(selectedSpace!)}
      space={currentSpace || null}
      isDeleting={deleteSpaceMutation.isPending}
    />

    {/* Edit Collection Dialog */}
    <EditCollectionDialog
      open={editCollectionOpen}
      onOpenChange={setEditCollectionOpen}
      onSubmit={(data) => updateCollectionMutation.mutate({ id: selectedCollection!, data })}
      onDelete={() => deleteCollectionMutation.mutate(selectedCollection!)}
      collection={currentCollection || null}
      isDeleting={deleteCollectionMutation.isPending}
    />



    {/* Share Dialog */}
    <ShareDialog
      open={sharesOpen}
      onOpenChange={setSharesOpen}
      workspaceId={currentWorkspaceId}
      shares={shares}
      onCreateShare={createShareMutation.mutate}
      onDeleteShare={deleteShareMutation.mutate}
      isLoadingShares={isLoadingShares}
    />

    
  </SidebarProvider>
    </div>
  );
}
