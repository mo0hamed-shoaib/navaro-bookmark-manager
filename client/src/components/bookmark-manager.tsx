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
  ChevronDown,
  GripVertical,
  FolderOpen,
  Folder,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
import type { Collection, Bookmark } from "@shared/schema";

const bookmarkFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Please enter a valid URL"),
  description: z.string().optional(),
  tags: z.string().optional(),
  collectionId: z.string().optional(),
});

type ViewMode = "grid" | "list" | "compact";

export function BookmarkManager() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchOpen, setSearchOpen] = useState(false);
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; bookmark: Bookmark } | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
  });

  const { data: bookmarks = [] } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks", selectedCollection],
    queryFn: async () => {
      const url = selectedCollection 
        ? `/api/bookmarks?collectionId=${selectedCollection}`
        : "/api/bookmarks";
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
      const bookmarkData = { ...data, tags };
      return apiRequest("POST", "/api/bookmarks", bookmarkData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks/recent"] });
      setAddBookmarkOpen(false);
    },
  });

  const updateBookmarkMutation = useMutation({
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

  const form = useForm<z.infer<typeof bookmarkFormSchema>>({
    resolver: zodResolver(bookmarkFormSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      tags: "",
      collectionId: "",
    },
  });

  const currentCollection = collections.find(c => c.id === selectedCollection);

  const togglePin = (bookmark: Bookmark) => {
    updateBookmarkMutation.mutate({
      id: bookmark.id,
      updates: { isPinned: !bookmark.isPinned },
    });
  };

  const deleteBookmark = (id: string) => {
    deleteBookmarkMutation.mutate(id);
  };

  const handleContextMenu = (e: React.MouseEvent, bookmark: Bookmark) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, bookmark });
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
    if (selectedBookmarks.size === bookmarks.length) {
      setSelectedBookmarks(new Set());
    } else {
      setSelectedBookmarks(new Set(bookmarks.map(b => b.id)));
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

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookmarkIcon className="text-primary-foreground text-sm" />
              </div>
              {!sidebarCollapsed && <span className="font-semibold text-lg">Toby</span>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              data-testid="sidebar-toggle"
            >
              <GripVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Quick Actions */}
          <div className="mb-4">
            {!sidebarCollapsed && (
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quick Actions
              </div>
            )}
            <div className="space-y-1 mt-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setAddBookmarkOpen(true)}
                data-testid="button-add-bookmark"
              >
                <Plus className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-3">Add Bookmark</span>}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setSearchOpen(true)}
                data-testid="button-search"
              >
                <Search className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-3">Search All</span>}
              </Button>
            </div>
          </div>

          {/* Pinned Items Widget */}
          <Collapsible defaultOpen>
            <div className="flex items-center justify-between px-2 py-1">
              {!sidebarCollapsed && (
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pinned
                </div>
              )}
              <div className="flex items-center space-x-1">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            <CollapsibleContent className="space-y-1 mt-2">
              {pinnedBookmarks.slice(0, 5).map((bookmark) => (
                <Button
                  key={bookmark.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => window.open(bookmark.url, "_blank")}
                  data-testid={`link-pinned-${bookmark.id}`}
                >
                  {bookmark.favicon && (
                    <img src={bookmark.favicon} className="w-4 h-4 rounded flex-shrink-0" alt="" />
                  )}
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-sm truncate">{bookmark.title}</span>
                  )}
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Recent Items Widget */}
          <Collapsible defaultOpen className="mt-4">
            <div className="flex items-center justify-between px-2 py-1">
              {!sidebarCollapsed && (
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Recent
                </div>
              )}
              <div className="flex items-center space-x-1">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            <CollapsibleContent className="space-y-1 mt-2">
              {recentBookmarks.slice(0, 5).map((bookmark) => (
                <Button
                  key={bookmark.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => window.open(bookmark.url, "_blank")}
                  data-testid={`link-recent-${bookmark.id}`}
                >
                  {bookmark.favicon && (
                    <img src={bookmark.favicon} className="w-4 h-4 rounded flex-shrink-0" alt="" />
                  )}
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-sm text-muted-foreground truncate">{bookmark.title}</span>
                  )}
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Collections */}
          <div className="mt-4">
            <div className="flex items-center justify-between px-2 py-1">
              {!sidebarCollapsed && (
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Collections
                </div>
              )}
              <Button variant="ghost" size="sm" className="p-1">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              <Button
                variant={selectedCollection === undefined ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedCollection(undefined)}
                data-testid="button-all-bookmarks"
              >
                <FolderOpen className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-3 flex-1 text-left">All Bookmarks</span>}
                {!sidebarCollapsed && (
                  <span className="text-xs text-muted-foreground">{bookmarks.length}</span>
                )}
              </Button>
              {collections.map((collection) => (
                <Button
                  key={collection.id}
                  variant={selectedCollection === collection.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCollection(collection.id)}
                  data-testid={`button-collection-${collection.id}`}
                >
                  <Folder className="h-4 w-4" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="ml-3 flex-1 text-left">{collection.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {bookmarks.filter(b => b.collectionId === collection.id).length}
                      </span>
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=32&h=32&fit=crop&crop=face" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <div className="text-sm font-medium">Demo User</div>
                <div className="text-xs text-muted-foreground">demo@example.com</div>
              </div>
            )}
            <Button variant="ghost" size="sm" className="p-1">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span className="hover:text-foreground transition-colors cursor-pointer">Home</span>
              <span>/</span>
              <span className="text-foreground font-medium">
                {currentCollection?.name || "All Bookmarks"}
              </span>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search bookmarks, collections, tags..."
                className="pl-10"
                onClick={() => setSearchOpen(true)}
                readOnly
                data-testid="input-search"
              />
            </div>
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
                {themeNames.map((themeName) => (
                  <DropdownMenuItem
                    key={themeName}
                    onClick={() => setTheme(themeName)}
                    className="flex items-center space-x-2"
                    data-testid={`button-theme-${themeName}`}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      themeName === "nomad" && "bg-gradient-to-r from-blue-500 to-green-500",
                      themeName === "quadratic" && "bg-gradient-to-r from-blue-600 to-purple-600",
                      themeName === "honey" && "bg-gradient-to-r from-yellow-400 to-orange-500",
                      themeName === "forest" && "bg-gradient-to-r from-green-400 to-green-600",
                      themeName === "midnight" && "bg-gradient-to-r from-gray-900 to-blue-900"
                    )} />
                    <span className="capitalize">{themeName}</span>
                  </DropdownMenuItem>
                ))}
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
                  {currentCollection?.name || "All Bookmarks"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {currentCollection?.description || "All your bookmarks in one place"}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {bookmarks.length} bookmarks
                </span>
                <Button variant="ghost" size="sm" data-testid="button-collection-settings">
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
                  {selectedBookmarks.size === bookmarks.length ? "Deselect All" : "Select All"}
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
          {bookmarks.length === 0 ? (
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
              "grid gap-4",
              viewMode === "grid" && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              viewMode === "list" && "grid-cols-1",
              viewMode === "compact" && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            )}>
              {bookmarks.map((bookmark) => (
                <ContextMenu key={bookmark.id}>
                  <ContextMenuTrigger>
                    <Card 
                      className={cn(
                        "hover:shadow-lg transition-all cursor-pointer group relative",
                        selectedBookmarks.has(bookmark.id) && "ring-2 ring-primary"
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
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          {bookmark.favicon && (
                            <img 
                              src={bookmark.favicon} 
                              alt="" 
                              className="w-12 h-12 rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {bookmark.title}
                            </h3>
                            {bookmark.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {bookmark.description}
                              </p>
                            )}
                            {bookmark.tags && bookmark.tags.length > 0 && (
                              <div className="flex items-center space-x-1 mt-3 flex-wrap gap-1">
                                {bookmark.tags.slice(0, 3).map((tag, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {bookmark.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{bookmark.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-muted-foreground truncate">
                                {new URL(bookmark.url).hostname}
                              </span>
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    // TODO: Open edit dialog
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
                          </div>
                        </div>
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
                    <ContextMenuItem data-testid={`menu-edit-${bookmark.id}`}>
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
      </main>

      {/* Search Dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search bookmarks, collections, tags..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Bookmarks">
            {bookmarks.slice(0, 5).map((bookmark) => (
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
    </div>
  );
}
