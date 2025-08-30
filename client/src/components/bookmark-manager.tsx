import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, 
  Plus, 
  Grid3X3, 
  List, 
  LayoutGrid, 
  Palette, 
  Settings, 
  User, 
  Bookmark as BookmarkIcon, 
  MoreHorizontal,
  Pin,
  Edit,
  ExternalLink,
  Copy,
  Trash,
  ChevronRight,
  CheckSquare,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger, ContextMenuItem } from "@/components/ui/context-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { themes, themeNames } from "@/lib/themes";
import { apiRequest } from "@/lib/queryClient";
import type { Space, Collection, Bookmark } from "@shared/schema";
import { workspaceManager } from "@/lib/workspace";
import { BookmarkSidebar } from "@/components/bookmark-sidebar";
import { AddSpaceDialog } from "@/components/add-space-dialog";
import { AddCollectionDialog } from "@/components/add-collection-dialog";
import { EditSpaceDialog } from "@/components/edit-space-dialog";
import { EditCollectionDialog } from "@/components/edit-collection-dialog";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

const bookmarkFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Please enter a valid URL"),
  description: z.string().optional(),
  tags: z.string().optional(),
  collectionId: z.string().optional(),
  previewImage: z.string().optional(),
  previewMode: z.enum(["auto", "manual"]).default("auto"),
});

type ViewMode = "grid" | "list" | "compact";

export function BookmarkManager() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);
  const [addSpaceOpen, setAddSpaceOpen] = useState(false);
  const [addCollectionOpen, setAddCollectionOpen] = useState(false);
  const [editSpaceOpen, setEditSpaceOpen] = useState(false);
  const [editCollectionOpen, setEditCollectionOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<string | undefined>();
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; bookmark: Bookmark } | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [editBookmarkOpen, setEditBookmarkOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

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
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  // Auto-select first space when spaces are loaded
  useEffect(() => {
    if (spaces.length > 0 && !selectedSpace) {
      setSelectedSpace(spaces[0].id);
      setExpandedSpaces(new Set([spaces[0].id]));
    }
  }, [spaces, selectedSpace]);

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
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get all bookmarks for sidebar counts (optimized with caching)
  const { data: allBookmarks = [] } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks"],
    queryFn: async () => {
      const response = await fetch("/api/bookmarks");
      if (!response.ok) throw new Error("Failed to fetch bookmarks");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get filtered bookmarks for current view
  const { data: bookmarks = [] } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks", selectedSpace, selectedCollection],
    queryFn: async () => {
      let url = "/api/bookmarks";
      if (selectedCollection) {
        url = `/api/bookmarks?collectionId=${selectedCollection}`;
      } else if (selectedSpace) {
        // If only space is selected, we'll filter client-side since the API doesn't support space filtering yet
        url = "/api/bookmarks";
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch bookmarks");
      return response.json();
    },
  });

  const { data: pinnedBookmarks = [] } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks/pinned"],
  });

  const { data: recentBookmarks = [] } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks/recent"],
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
      const bookmarkData = { ...data, tags };
      return apiRequest("PATCH", `/api/bookmarks/${id}`, bookmarkData);
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

  // Filter bookmarks based on selected space and collection
  const filteredBookmarks = (() => {
    // If searching, use allBookmarks for global search
    if (searchQuery.trim()) {
      return allBookmarks.filter(bookmark => {
        const query = searchQuery.toLowerCase();
        return bookmark.title.toLowerCase().includes(query) ||
               bookmark.url.toLowerCase().includes(query) ||
               bookmark.description?.toLowerCase().includes(query) ||
               (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(query)));
      });
    }
    
    // If not searching, use the space/collection filtered bookmarks
    return bookmarks;
  })();

  const togglePin = (bookmark: Bookmark) => {
    updateBookmarkMutation.mutate({
      id: bookmark.id,
      data: { isPinned: !bookmark.isPinned } as any,
    });
  };

  const deleteBookmark = (id: string) => {
    deleteBookmarkMutation.mutate(id);
  };

  const handleContextMenu = (e: React.MouseEvent, bookmark: Bookmark) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, bookmark });
  };

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
    // Toggle expansion when clicking the space
    toggleSpaceExpansion(spaceId);
    // Select the space
    setSelectedSpace(spaceId);
    setSelectedCollection(undefined);
  };

  const handleHomeClick = () => {
    setSelectedSpace(undefined);
    setSelectedCollection(undefined);
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
    if (selectedBookmarks.size === filteredBookmarks.length) {
      setSelectedBookmarks(new Set());
    } else {
      setSelectedBookmarks(new Set(filteredBookmarks.map(b => b.id)));
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
      });
    }
  }, [editBookmarkOpen, editingBookmark, form]);

  return (
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
        expandedSpaces={expandedSpaces}
        onSpaceClick={handleSpaceClick}
        onCollectionClick={setSelectedCollection}
        onToggleSpaceExpansion={toggleSpaceExpansion}
        onAddBookmark={() => setAddBookmarkOpen(true)}
        onAddSpace={() => setAddSpaceOpen(true)}
        onAddCollection={(spaceId) => {
          // When adding collection from space context menu, pre-select that space
          if (spaceId) {
            setSelectedSpace(spaceId);
          }
          setAddCollectionOpen(true);
        }}
        onEditSpace={(spaceId) => {
          setSelectedSpace(spaceId);
          setEditSpaceOpen(true);
        }}
        onEditCollection={(collectionId) => {
          setSelectedCollection(collectionId);
          setEditCollectionOpen(true);
        }}
        onDeleteSpace={(spaceId) => {
          if (confirm(`Are you sure you want to delete this space? This will also delete all collections and bookmarks within it.`)) {
            deleteSpaceMutation.mutate(spaceId);
          }
        }}
        onDeleteCollection={(collectionId) => {
          if (confirm(`Are you sure you want to delete this collection? This will also delete all bookmarks within it.`)) {
            deleteCollectionMutation.mutate(collectionId);
          }
        }}
        onSearch={() => {
          setSearchOpen(true);
          // Focus the search input when search dialog opens
          setTimeout(() => {
            const searchInput = document.querySelector('[data-testid="input-search"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
          }, 100);
        }}
        onSettings={() => setSettingsOpen(true)}
        currentWorkspaceId={currentWorkspaceId}
        isLoadingSpaces={isLoadingSpaces}
        isLoadingCollections={isLoadingCollections}
      />

      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <button 
                onClick={handleHomeClick}
                className="hover:text-foreground transition-colors cursor-pointer hover:underline"
                title="Go to All Bookmarks"
              >
                Home
              </button>
              {currentSpace && (
                <>
                  <span>/</span>
                  <button 
                    onClick={() => {
                      setSelectedSpace(currentSpace.id);
                      setSelectedCollection(undefined);
                    }}
                    className="hover:text-foreground transition-colors cursor-pointer hover:underline"
                    title={`Go to ${currentSpace.name}`}
                  >
                    {currentSpace.name}
                  </button>
                </>
              )}
              {currentCollection && (
                <>
                  <span>/</span>
                  <span className="text-foreground font-medium">
                    {currentCollection.name}
                  </span>
                </>
              )}
              {!currentSpace && !currentCollection && (
                <span className="text-foreground font-medium">All Bookmarks</span>
              )}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search bookmarks, collections, tags..."
                className="pl-10 pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                data-testid="input-search"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="text-xs text-muted-foreground mt-1">
                Found {filteredBookmarks.length} result{filteredBookmarks.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid"
                title="Grid View"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "compact" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("compact")}
                data-testid="button-view-compact"
                title="Compact View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {/* Add Bookmark */}
            <Button onClick={() => setAddBookmarkOpen(true)} data-testid="button-add-bookmark-header">
              <Plus className="h-4 w-4 mr-2" />
              Add Bookmark
            </Button>

            {/* Theme Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
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

            {/* User Menu */}
            <Button variant="ghost" size="sm" data-testid="button-user-menu">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Collection Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {currentCollection?.name || currentSpace?.name || "All Bookmarks"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {currentCollection?.description || currentSpace?.description || "All your bookmarks in one place"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {filteredBookmarks.length} bookmarks
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleContextSettings}
                  data-testid="button-collection-settings"
                  title={selectedCollection ? "Edit Collection" : selectedSpace ? "Edit Space" : "Settings"}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllBookmarks}
                  data-testid="button-select-all"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {selectedBookmarks.size === filteredBookmarks.length ? "Deselect All" : "Select All"}
                </Button>
                {selectedBookmarks.size > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedBookmarks.size} selected
                    </span>
                    <Button size="sm" variant="secondary" data-testid="button-bulk-move">
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
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              <Select defaultValue="date">
                <SelectTrigger className="w-48" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date Added</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="visits">Sort by Most Visited</SelectItem>
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
            <div className={cn(
              "gap-4",
              viewMode === "grid" && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              viewMode === "list" && "flex flex-col space-y-3",
              viewMode === "compact" && "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
            )}>
              {filteredBookmarks.map((bookmark) => (
                <ContextMenu key={bookmark.id}>
                  <ContextMenuTrigger>
                    <Card 
                      className={cn(
                        "hover:shadow-lg transition-all cursor-pointer group relative",
                        selectedBookmarks.has(bookmark.id) && "ring-2 ring-primary",
                        viewMode === "grid" && "h-64",
                        viewMode === "list" && "h-20",
                        viewMode === "compact" && "h-24"
                      )}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey) {
                          toggleSelectBookmark(bookmark.id);
                        } else {
                          window.open(bookmark.url, "_blank");
                        }
                      }}
                      data-testid={`card-bookmark-${bookmark.id}`}
                    >
                      <CardContent className={cn(
                        "p-4 h-full",
                        viewMode === "list" && "p-3"
                      )}>
                        {viewMode === "grid" && (
                          <div className="flex flex-col h-full">
                            {/* Preview Image */}
                            {bookmark.preview?.image && (
                              <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                                <img 
                                  src={bookmark.preview.image} 
                                  alt="" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {/* Content */}
                            <div className="flex items-start space-x-3 flex-1">
                              {bookmark.favicon && (
                                <img 
                                  src={bookmark.favicon} 
                                  alt="" 
                                  className="w-8 h-8 rounded flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors text-sm">
                                  {bookmark.title}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {bookmark.description || new URL(bookmark.url).hostname}
                                </p>
                                {bookmark.tags && bookmark.tags.length > 0 && (
                                  <div className="flex items-center space-x-1 mt-2 flex-wrap gap-1">
                                    {bookmark.tags.slice(0, 2).map((tag, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="text-xs px-1.5 py-0.5"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                    {bookmark.tags.length > 2 && (
                                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                        +{bookmark.tags.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePin(bookmark);
                                  }}
                                  data-testid={`button-pin-${bookmark.id}`}
                                  title={bookmark.isPinned ? "Unpin" : "Pin"}
                                >
                                  <Pin className={cn(
                                    "h-3 w-3",
                                    bookmark.isPinned && "fill-current"
                                  )} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBookmark(bookmark);
                                    setEditBookmarkOpen(true);
                                  }}
                                  data-testid={`button-edit-${bookmark.id}`}
                                  title="Edit"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleContextMenu(e, bookmark);
                                  }}
                                  data-testid={`button-more-${bookmark.id}`}
                                  title="More"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {viewMode === "list" && (
                          <div className="flex items-center space-x-4 h-full">
                            {bookmark.favicon && (
                              <img 
                                src={bookmark.favicon} 
                                alt="" 
                                className="w-10 h-10 rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {bookmark.title}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {bookmark.description || new URL(bookmark.url).hostname}
                              </p>
                            </div>
                            {bookmark.tags && bookmark.tags.length > 0 && (
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                {bookmark.tags.slice(0, 2).map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {bookmark.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{bookmark.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(bookmark);
                                }}
                                data-testid={`button-pin-${bookmark.id}`}
                                title={bookmark.isPinned ? "Unpin" : "Pin"}
                              >
                                <Pin className={cn(
                                  "h-3 w-3",
                                  bookmark.isPinned && "fill-current"
                                )} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBookmark(bookmark);
                                  setEditBookmarkOpen(true);
                                }}
                                data-testid={`button-edit-${bookmark.id}`}
                                title="Edit"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContextMenu(e, bookmark);
                                }}
                                data-testid={`button-more-${bookmark.id}`}
                                title="More"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {viewMode === "compact" && (
                          <div className="flex flex-col h-full justify-center items-center text-center">
                            {bookmark.favicon && (
                              <img 
                                src={bookmark.favicon} 
                                alt="" 
                                className="w-8 h-8 rounded mb-2 flex-shrink-0"
                              />
                            )}
                            <h3 className="font-medium text-foreground text-xs truncate group-hover:text-primary transition-colors w-full">
                              {bookmark.title}
                            </h3>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-0.5 h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(bookmark);
                                }}
                                data-testid={`button-pin-${bookmark.id}`}
                                title={bookmark.isPinned ? "Unpin" : "Pin"}
                              >
                                <Pin className={cn(
                                  "h-2.5 w-2.5",
                                  bookmark.isPinned && "fill-current"
                                )} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-0.5 h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBookmark(bookmark);
                                  setEditBookmarkOpen(true);
                                }}
                                data-testid={`button-edit-${bookmark.id}`}
                                title="Edit"
                              >
                                <Edit className="h-2.5 w-2.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-0.5 h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContextMenu(e, bookmark);
                                }}
                                data-testid={`button-more-${bookmark.id}`}
                                title="More"
                              >
                                <MoreHorizontal className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() => window.open(bookmark.url, "_self")}
                      data-testid={`menu-open-${bookmark.id}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => window.open(bookmark.url, "_blank")}
                      data-testid={`menu-open-new-tab-${bookmark.id}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => togglePin(bookmark)}
                      data-testid={`menu-pin-${bookmark.id}`}
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      {bookmark.isPinned ? "Unpin" : "Pin to Top"}
                    </ContextMenuItem>
                    <ContextMenuItem 
                      onClick={() => {
                        setEditingBookmark(bookmark);
                        setEditBookmarkOpen(true);
                      }}
                      data-testid={`menu-edit-${bookmark.id}`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => navigator.clipboard.writeText(bookmark.url)}
                      data-testid={`menu-copy-${bookmark.id}`}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="text-destructive"
                      data-testid={`menu-delete-${bookmark.id}`}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>

      {/* Search Dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search bookmarks, collections, tags..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Bookmarks">
            {filteredBookmarks.slice(0, 5).map((bookmark) => (
              <CommandItem
                key={bookmark.id}
                onSelect={() => {
                  window.open(bookmark.url, "_blank");
                  setSearchOpen(false);
                }}
                data-testid={`search-result-${bookmark.id}`}
              >
                {bookmark.favicon && (
                  <img src={bookmark.favicon} className="w-4 h-4 rounded mr-2" alt="" />
                )}
                <span>{bookmark.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Add Bookmark Dialog */}
      <Dialog open={addBookmarkOpen} onOpenChange={setAddBookmarkOpen}>
        <DialogContent data-testid="dialog-add-bookmark">
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
        <DialogContent className="max-w-md" data-testid="dialog-edit-bookmark">
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
                            <span className="mr-2">{collection.icon}</span>
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
        <DialogContent className="max-w-2xl" data-testid="dialog-settings">
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
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {themeNames.map((themeName) => {
                      const themeDisplayName = themes[themeName]?.name || themeName;
                      return (
                        <Button
                          key={themeName}
                          variant={theme === themeName ? "default" : "outline"}
                          className="justify-start h-auto p-3"
                          onClick={() => setTheme(themeName)}
                          data-testid={`settings-theme-${themeName}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-4 h-4 rounded-full",
                              themeName === "highlighter" && "bg-gradient-to-r from-green-400 to-purple-400",
                              themeName === "zen-garden" && "bg-gradient-to-r from-green-300 to-purple-300",
                              themeName === "honey" && "bg-gradient-to-r from-yellow-400 to-orange-500",
                              themeName === "nomad" && "bg-gradient-to-r from-red-500 to-gray-400",
                              themeName === "quadratic" && "bg-gradient-to-r from-gray-900 to-white"
                            )} />
                            <span className="text-sm">{themeDisplayName}</span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Default View Mode</label>
                  <div className="flex space-x-2 mt-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                    <Button
                      variant={viewMode === "compact" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("compact")}
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
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Export Bookmarks</div>
                    <div className="text-xs text-muted-foreground">Download your bookmarks as JSON</div>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-export-bookmarks">
                    Export
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Import Bookmarks</div>
                    <div className="text-xs text-muted-foreground">Import from JSON file</div>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-import-bookmarks">
                    Import
                  </Button>
                </div>
              </div>
            </div>

            {/* About */}
            <div>
              <h3 className="text-lg font-medium mb-4">About</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <div>Toby Bookmark Manager v1.0</div>
                <div>A modern alternative to browser bookmark management</div>
                <div className="flex items-center space-x-4 pt-2">
                  <Button variant="outline" size="sm">
                    Keyboard Shortcuts
                  </Button>
                  <Button variant="outline" size="sm">
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
      space={currentSpace}
      isDeleting={deleteSpaceMutation.isPending}
    />

    {/* Edit Collection Dialog */}
    <EditCollectionDialog
      open={editCollectionOpen}
      onOpenChange={setEditCollectionOpen}
      onSubmit={(data) => updateCollectionMutation.mutate({ id: selectedCollection!, data })}
      onDelete={() => deleteCollectionMutation.mutate(selectedCollection!)}
      collection={currentCollection}
      isDeleting={deleteCollectionMutation.isPending}
    />
  </SidebarProvider>
  );
}
