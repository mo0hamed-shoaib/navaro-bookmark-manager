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
import type { Space } from "@shared/schema"

const addCollectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().default("folder"),
  spaceId: z.string().min(1, "Space is required"),
})

type AddCollectionForm = z.infer<typeof addCollectionSchema>

interface AddCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AddCollectionForm) => void
  spaces: Space[]
  selectedSpaceId?: string
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

export function AddCollectionDialog({
  open,
  onOpenChange,
  onSubmit,
  spaces,
  selectedSpaceId,
}: AddCollectionDialogProps) {
  const form = useForm<AddCollectionForm>({
    resolver: zodResolver(addCollectionSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "folder",
      spaceId: selectedSpaceId || "",
    },
  })

  // Update form when selectedSpaceId changes
  React.useEffect(() => {
    if (selectedSpaceId) {
      form.setValue("spaceId", selectedSpaceId)
    }
  }, [selectedSpaceId, form])

  const handleSubmit = (data: AddCollectionForm) => {
    onSubmit(data)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-none sm:max-w-[425px] md:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add New Collection</DialogTitle>
          <DialogDescription>
            Create a new collection to organize your bookmarks. Choose a name, description, and icon.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Enter collection name"
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
              placeholder="Enter collection description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spaceId">Space</Label>
            <select
              id="spaceId"
              {...form.register("spaceId")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a space</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
            {form.formState.errors.spaceId && (
              <p className="text-sm text-destructive">{form.formState.errors.spaceId.message}</p>
            )}
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
              {form.formState.isSubmitting ? "Creating..." : "Create Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
