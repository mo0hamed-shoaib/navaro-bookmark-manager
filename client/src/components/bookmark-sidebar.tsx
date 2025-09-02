"use client"

import * as React from "react"
import {
  Bookmark as BookmarkIcon,
  Plus,
  Search,
  Settings,
  ChevronRight,
  Clock,
  Folder,
  Home,
  Briefcase,
  Heart,
  Star,
  Zap,
  Target,
  Edit,
  Trash,
  Share,
  type LucideIcon,
} from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { Space, Collection, Bookmark } from "@shared/schema"
import { useState } from "react";

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

interface BookmarkSidebarProps {
  spaces: Space[]
  collections: Collection[]
  bookmarks: Bookmark[]
  allBookmarks: Bookmark[]
  pinnedBookmarks: Bookmark[]
  recentBookmarks: Bookmark[]
  selectedSpace?: string
  selectedCollection?: string
  isAllBookmarksView?: boolean
  expandedSpaces: Set<string>
  onSpaceClick: (spaceId: string) => void
  onCollectionClick: (collectionId: string) => void
  onToggleSpaceExpansion: (spaceId: string) => void
  onAddBookmark: () => void
  onAddSpace: () => void
  onAddCollection: (spaceId?: string) => void
  onEditSpace: (spaceId: string) => void
  onEditCollection: (collectionId: string) => void
  onDeleteSpace: (spaceId: string) => void
  onDeleteCollection: (collectionId: string) => void
  onSearch: () => void

  onShares: () => void
  onSettings: () => void
  currentWorkspaceId?: string | null
  isLoadingSpaces?: boolean
  isLoadingCollections?: boolean
}

export function BookmarkSidebar({
  spaces,
  collections,
  bookmarks,
  allBookmarks,
  pinnedBookmarks,
  recentBookmarks,
  selectedSpace,
  selectedCollection,
  isAllBookmarksView = false,
  expandedSpaces,
  onSpaceClick,
  onCollectionClick,
  onToggleSpaceExpansion,
  onAddBookmark,
  onAddSpace,
  onAddCollection,
  onEditSpace,
  onEditCollection,
  onDeleteSpace,
  onDeleteCollection,
  onSearch,

  onShares,
  onSettings,
  currentWorkspaceId,
  isLoadingSpaces = false,
  isLoadingCollections = false,
}: BookmarkSidebarProps) {

  const isSpaceExpanded = (spaceId: string) => expandedSpaces.has(spaceId)

  // Helper function to get icon component based on icon name
  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'home': return Home
      case 'briefcase': return Briefcase
      case 'heart': return Heart
      case 'star': return Star
      case 'zap': return Zap
      case 'target': return Target
      case 'bookmark': return BookmarkIcon
      case 'clock': return Clock
      default: return Folder
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r">
             <SidebarHeader>
         <div className="flex items-center gap-2">
                                   <div className="w-8 h-8 flex items-center justify-center">
              <img src="/navaro-logo.png" alt="Navaro" className="w-8 h-8" />
            </div>
           <div className="flex-1 min-w-0 group-data-[state=collapsed]:hidden">
             <div className="font-semibold text-lg">Navaro</div>
             {currentWorkspaceId && (
               <div className="text-xs text-muted-foreground">
                 Workspace: {currentWorkspaceId.substring(0, 8)}...
               </div>
             )}
           </div>
         </div>
       </SidebarHeader>

      <SidebarContent>
        {/* Actions & Views */}
        <SidebarGroup>
          <SidebarGroupLabel>Actions & Views</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onShares} tooltip="Share Workspace" className="cursor-pointer">
                <Share />
                <span>Share</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={isAllBookmarksView}
                onClick={() => {
                  // This will trigger the home click handler
                  onSpaceClick(""); // Empty string to indicate "All Bookmarks"
                }}
                tooltip="All Bookmarks"
                className="cursor-pointer"
              >
                <Home />
                <span>All Bookmarks</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {allBookmarks.length}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible defaultOpen>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip="Pinned Bookmarks" className="cursor-pointer">
                    <BookmarkIcon />
                    <span>Pinned</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {pinnedBookmarks.slice(0, 5).map((bookmark) => (
                      <SidebarMenuSubItem key={bookmark.id}>
                        <SidebarMenuSubButton
                          asChild
                          onClick={() => window.open(bookmark.url, "_blank")}
                        >
                          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer" title={bookmark.title}>
                            {bookmark.favicon && (
                              <Favicon src={bookmark.favicon} className="w-4 h-4 rounded flex-shrink-0" alt="" />
                            )}
                            <span>{bookmark.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <Collapsible defaultOpen>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip="Recent Bookmarks" className="cursor-pointer">
                    <Clock />
                    <span>Recent</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {recentBookmarks.slice(0, 3).map((bookmark) => (
                      <SidebarMenuSubItem key={bookmark.id}>
                        <SidebarMenuSubButton
                          asChild
                          onClick={() => window.open(bookmark.url, "_blank")}
                        >
                          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer" title={bookmark.title}>
                            {bookmark.favicon && (
                              <Favicon src={bookmark.favicon} className="w-4 h-4 rounded flex-shrink-0" alt="" />
                            )}
                            <span>{bookmark.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>

        {/* Spaces */}
        <SidebarGroup>
          <SidebarGroupLabel>Spaces & Collections</SidebarGroupLabel>
          <SidebarMenu>
            {isLoadingSpaces && (
              <div className="px-2 py-1">
                <div className="h-8 bg-muted animate-pulse rounded-md"></div>
              </div>
            )}
           <SidebarMenuItem>
             <SidebarMenuButton onClick={onAddSpace} tooltip="Add Space" className="cursor-pointer">
               <Plus />
               <span>Add Space</span>
             </SidebarMenuButton>
           </SidebarMenuItem>
                       {spaces.map((space) => (
             <Collapsible
               key={space.id}
               asChild
               defaultOpen={isSpaceExpanded(space.id)}
               className="group/collapsible"
             >
               <SidebarMenuItem>
                 <ContextMenu>
                   <ContextMenuTrigger asChild>
                     <CollapsibleTrigger asChild>
                                                 <SidebarMenuButton
                          isActive={selectedSpace === space.id && selectedCollection === undefined}
                          onClick={() => onSpaceClick(space.id)}
                          tooltip={space.name}
                          className="cursor-pointer"
                        >
                                                     {React.createElement(getIconComponent(space.icon), { className: "w-4 h-4" })}
                          <span>{space.name}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                       </SidebarMenuButton>
                     </CollapsibleTrigger>
                   </ContextMenuTrigger>
                                         <ContextMenuContent>
                      <ContextMenuItem onClick={() => onAddCollection(space.id)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Collection
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => onEditSpace(space.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Space
                      </ContextMenuItem>
                      <ContextMenuItem 
                        onClick={() => onDeleteSpace(space.id)}
                        className="text-destructive"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Space
                      </ContextMenuItem>
                    </ContextMenuContent>
                 </ContextMenu>
                                                       <CollapsibleContent>
                    <SidebarMenuSub>
                      {isLoadingCollections && (
                        <div className="px-2 py-1">
                          <div className="h-6 bg-muted animate-pulse rounded-md mb-1"></div>
                          <div className="h-6 bg-muted animate-pulse rounded-md"></div>
                        </div>
                      )}
                      {collections
                        .filter(c => c.spaceId === space.id)
                        .map((collection) => (
                           <SidebarMenuSubItem key={collection.id}>
                             <ContextMenu>
                               <ContextMenuTrigger asChild>
                                                                     <SidebarMenuSubButton
                                    isActive={selectedCollection === collection.id}
                                    onClick={() => onCollectionClick(collection.id)}
                                    title={collection.name}
                                    className="cursor-pointer"
                                  >
                                   {React.createElement(getIconComponent(collection.icon), { className: "w-4 h-4" })}
                                   <span>{collection.name}</span>
                                   <span className="ml-auto text-xs text-muted-foreground">
                                     {allBookmarks.filter(b => b.collectionId === collection.id).length}
                                   </span>
                                 </SidebarMenuSubButton>
                               </ContextMenuTrigger>
                               <ContextMenuContent>
                                 <ContextMenuItem onClick={() => onEditCollection(collection.id)}>
                                   <Edit className="h-4 w-4 mr-2" />
                                   Edit Collection
                                 </ContextMenuItem>
                                 <ContextMenuItem 
                                   onClick={() => onDeleteCollection(collection.id)}
                                   className="text-destructive"
                                 >
                                   <Trash className="h-4 w-4 mr-2" />
                                   Delete Collection
                                 </ContextMenuItem>
                               </ContextMenuContent>
                             </ContextMenu>
                           </SidebarMenuSubItem>
                         ))}
                   </SidebarMenuSub>
                 </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroup>
      </SidebarContent>

             <SidebarFooter>
         <SidebarMenu>
           <SidebarMenuItem>
                            <SidebarMenuButton onClick={onSettings} tooltip="Settings" className="cursor-pointer">
               <Settings />
               <span>Settings</span>
             </SidebarMenuButton>
           </SidebarMenuItem>
         </SidebarMenu>
       </SidebarFooter>
       <SidebarRail />
     </Sidebar>
   )
 }