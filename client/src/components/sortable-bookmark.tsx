import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger, ContextMenuItem } from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import type { Bookmark } from "@shared/schema";

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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
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
                  </div>
                </div>
              )}

              {viewMode === "grid2" && (
                <div className="flex items-center space-x-3 h-full">
                  {bookmark.favicon && (
                    <img 
                      src={bookmark.favicon} 
                      alt="" 
                      className="w-6 h-6 rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors text-sm">
                      {bookmark.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {new URL(bookmark.url).hostname}
                    </p>
                  </div>
                </div>
              )}

              {viewMode === "list" && (
                <div className="flex items-center space-x-3 h-full">
                  {bookmark.favicon && (
                    <img 
                      src={bookmark.favicon} 
                      alt="" 
                      className="w-8 h-8 rounded flex-shrink-0"
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
                    <div className="flex items-center space-x-1">
                      {bookmark.tags.slice(0, 1).map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs px-1.5 py-0.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {viewMode === "compact" && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  {bookmark.favicon && (
                    <img 
                      src={bookmark.favicon} 
                      alt="" 
                      className="w-8 h-8 rounded mb-2"
                    />
                  )}
                  <h3 className="font-medium text-foreground text-xs truncate w-full group-hover:text-primary transition-colors">
                    {bookmark.title}
                  </h3>
                </div>
              )}

              {/* Pin indicator */}
              {bookmark.isPinned && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 left-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onOpenUrl(bookmark.url)}>
            Open Link
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onCopyUrl(bookmark.url)}>
            Copy URL
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onEdit(bookmark)}>
            Edit
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onPin(bookmark)}>
            {bookmark.isPinned ? "Unpin" : "Pin"}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDelete(bookmark.id)}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
