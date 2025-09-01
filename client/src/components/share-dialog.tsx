"use client"

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Trash, Calendar, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Share } from "@shared/schema";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | null;
  shares: Share[];
  onCreateShare: (data: { name: string; description: string; expiresAt?: Date }) => void;
  onDeleteShare: (shareId: string) => void;
  isLoadingShares: boolean;
}

export function ShareDialog({
  open,
  onOpenChange,
  workspaceId,
  shares,
  onCreateShare,
  onDeleteShare,
  isLoadingShares,
}: ShareDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const { toast } = useToast();

  const handleCreateShare = () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this share link.",
        variant: "destructive",
      });
      return;
    }

    const expiresDate = expiresAt ? new Date(expiresAt) : undefined;
    onCreateShare({
      name: name.trim(),
      description: description.trim(),
      expiresAt: expiresDate,
    });

    // Reset form
    setName("");
    setDescription("");
    setExpiresAt("");
  };

  const copyShareLink = (viewKey: string) => {
    const shareUrl = `${window.location.origin}/s/${viewKey}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard.",
    });
  };

  const getShareUrl = (viewKey: string) => {
    return `${window.location.origin}/s/${viewKey}`;
  };

  const isExpired = (share: Share) => {
    return share.expiresAt && new Date(share.expiresAt) < new Date();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-none sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Share Workspace</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new share */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Create Share Link</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="share-name">Name</Label>
                <Input
                  id="share-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Team Resources, Project Links"
                />
              </div>
              <div>
                <Label htmlFor="share-description">Description (Optional)</Label>
                <Textarea
                  id="share-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of what this share contains"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="share-expires">Expires At (Optional)</Label>
                <Input
                  id="share-expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateShare} className="w-full">
                Create Share Link
              </Button>
            </div>
          </div>

          {/* Existing shares */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Active Share Links</h3>
            {isLoadingShares ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading shares...
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No share links created yet.
              </div>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <Card key={share.id} className={isExpired(share) ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {share.name}
                            {isExpired(share) && (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            )}
                          </CardTitle>
                          {share.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {share.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteShare(share.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Created {formatDistanceToNow(share.createdAt, { addSuffix: true })}
                          </div>
                          {share.expiresAt && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              Expires {formatDistanceToNow(share.expiresAt, { addSuffix: true })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={getShareUrl(share.viewKey)}
                            readOnly
                            className="text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyShareLink(share.viewKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(getShareUrl(share.viewKey), "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
