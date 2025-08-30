"use client"

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Clock, Trash, Play, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Session, SessionTab } from "@shared/schema";

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: Session[];
  sessionTabs: SessionTab[];
  selectedSession: Session | null;
  onSessionSelect: (session: Session | null) => void;
  onDeleteSession: (sessionId: string) => void;
  onRestoreSession: (sessionId: string) => void;
  isLoadingSessions: boolean;
}

export function SessionDialog({
  open,
  onOpenChange,
  sessions,
  sessionTabs,
  selectedSession,
  onSessionSelect,
  onDeleteSession,
  onRestoreSession,
  isLoadingSessions,
}: SessionDialogProps) {
  const handleSessionClick = (session: Session) => {
    onSessionSelect(session);
  };

  const handleRestoreSession = (sessionId: string) => {
    onRestoreSession(sessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      onDeleteSession(sessionId);
    }
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Saved Sessions
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Sessions List */}
          <div className="w-1/3 border-r pr-4 overflow-y-auto">
            <div className="space-y-2">
              {isLoadingSessions ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-md"></div>
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved sessions yet</p>
                  <p className="text-sm">Use the bookmarklet to save your browser sessions</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <Card
                    key={session.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSession?.id === session.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleSessionClick(session)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">
                            {session.name}
                          </CardTitle>
                          {session.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {session.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Session Details */}
          <div className="flex-1 overflow-y-auto">
            {selectedSession ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedSession.name}</h3>
                    {selectedSession.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedSession.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRestoreSession(selectedSession.id)}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Restore Session
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Tabs ({sessionTabs.length})
                  </h4>
                  {sessionTabs.map((tab, index) => (
                    <Card key={tab.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={tab.favicon || getFavicon(tab.url)} />
                          <AvatarFallback className="text-xs">
                            {tab.title.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tab.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{tab.url}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(tab.url, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a session to view details</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
