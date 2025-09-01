"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Bookmark as BookmarkIcon,
  Home,
  Briefcase,
  Heart,
  Star,
  Zap,
  Target,
  Clock,
  Folder,
} from "lucide-react"

const addSpaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().default("folder"),
})

type AddSpaceForm = z.infer<typeof addSpaceSchema>

interface AddSpaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AddSpaceForm) => void
  currentWorkspaceId?: string | null
}

const iconOptions = [
  { name: "folder", icon: Folder, label: "Folder" },
  { name: "home", icon: Home, label: "Home" },
  { name: "briefcase", icon: Briefcase, label: "Work" },
  { name: "heart", icon: Heart, label: "Favorites" },
  { name: "star", icon: Star, label: "Starred" },
  { name: "zap", icon: Zap, label: "Quick" },
  { name: "target", icon: Target, label: "Goals" },
  { name: "bookmark", icon: BookmarkIcon, label: "Bookmarks" },
  { name: "clock", icon: Clock, label: "Recent" },
]

export function AddSpaceDialog({
  open,
  onOpenChange,
  onSubmit,
  currentWorkspaceId,
}: AddSpaceDialogProps) {
  const form = useForm<AddSpaceForm>({
    resolver: zodResolver(addSpaceSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "folder",
    },
  })

  const handleSubmit = (data: AddSpaceForm) => {
    onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-none sm:max-w-[425px] md:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add New Space</DialogTitle>
          <DialogDescription>
            Create a new space to organize your bookmarks. Choose a name, description, and icon.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter space name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Enter space description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-4 gap-2">
              {iconOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <Button
                    key={option.name}
                    type="button"
                    variant={form.watch("icon") === option.name ? "default" : "outline"}
                    size="sm"
                    className="h-12 flex-col gap-1"
                    onClick={() => form.setValue("icon", option.name)}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-xs">{option.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating..." : "Create Space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
