import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger, ContextMenuItem } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { ExternalLink, Edit, Pin, Trash2, Copy, MoreHorizontal, GripVertical } from "lucide-react";
import type { Bookmark } from "@shared/schema";
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

interface SortableBookmarkProps {
  bookmark: Bookmark;
  viewMode: "grid" | "list" | "compact" | "grid2";
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onPin: (bookmark: Bookmark) => void;
  onCopyUrl: (url: string) => void;
  onOpenUrl: (url: string) => void;
}

export function SortableBookmark({
  bookmark,
  viewMode,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onPin,
  onCopyUrl,
  onOpenUrl,
}: SortableBookmarkProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bookmark.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      onToggleSelect(bookmark.id);
    } else {
      onOpenUrl(bookmark.url);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, bookmark: Bookmark) => {
    e.stopPropagation();
    // Trigger context menu by simulating right-click
    const rect = e.currentTarget.getBoundingClientRect();
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.bottom + 5,
    });
    e.currentTarget.dispatchEvent(contextMenuEvent);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ContextMenu>
        <ContextMenuTrigger>
          <Card 
            className={cn(
              "hover:shadow-lg transition-all cursor-pointer group relative",
              isSelected && "ring-2 ring-primary",
              viewMode === "grid" && "h-64",
              viewMode === "grid2" && "h-24",
              viewMode === "list" && "h-20",
              viewMode === "compact" && "h-24",
              isDragging && "opacity-50"
            )}
            onClick={handleClick}
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
                      <Favicon 
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
                          onPin(bookmark);
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
                          onEdit(bookmark);
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6 cursor-grab active:cursor-grabbing"
                        {...attributes}
                        {...listeners}
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {viewMode === "grid2" && (
                <div className="flex flex-col h-full justify-center items-center text-center">
                  {bookmark.favicon && (
                    <Favicon 
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
                        onPin(bookmark);
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
                        onEdit(bookmark);
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0.5 h-5 w-5 cursor-grab active:cursor-grabbing"
                      {...attributes}
                      {...listeners}
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              )}

              {viewMode === "list" && (
                <div className="flex items-center space-x-4 h-full">
                  {bookmark.favicon && (
                    <Favicon 
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
                        onPin(bookmark);
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
                        onEdit(bookmark);
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 cursor-grab active:cursor-grabbing"
                      {...attributes}
                      {...listeners}
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {viewMode === "compact" && (
                <div className="flex flex-col h-full justify-center items-center text-center">
                  {bookmark.favicon && (
                    <Favicon 
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
                        onPin(bookmark);
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
                        onEdit(bookmark);
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0.5 h-5 w-5 cursor-grab active:cursor-grabbing"
                      {...attributes}
                      {...listeners}
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Pin indicator */}
              {bookmark.isPinned && (
                <div className="absolute top-2 left-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute bottom-2 left-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => window.open(bookmark.url, "_self")}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open
          </ContextMenuItem>
          <ContextMenuItem onClick={() => window.open(bookmark.url, "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onPin(bookmark)}>
            <Pin className={cn("mr-2 h-4 w-4", bookmark.isPinned && "fill-current")} />
            {bookmark.isPinned ? "Unpin" : "Pin to Top"}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onEdit(bookmark)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onCopyUrl(bookmark.url)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDelete(bookmark.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
