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
import type { Collection } from "@shared/schema"

const editCollectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().default("folder"),
})

type EditCollectionForm = z.infer<typeof editCollectionSchema>

interface EditCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: EditCollectionForm) => void
  onDelete: () => void
  collection: Collection | null
  isDeleting?: boolean
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

export function EditCollectionDialog({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  collection,
  isDeleting = false,
}: EditCollectionDialogProps) {
  const form = useForm<EditCollectionForm>({
    resolver: zodResolver(editCollectionSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "folder",
    },
  })

  // Update form when collection changes
  React.useEffect(() => {
    if (collection) {
      form.reset({
        name: collection.name,
        description: collection.description || "",
        icon: collection.icon || "folder",
      })
    }
  }, [collection, form])

  const handleSubmit = (data: EditCollectionForm) => {
    onSubmit(data)
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${collection?.name}"? This will also delete all bookmarks within this collection.`)) {
      onDelete()
    }
  }

  if (!collection) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-none sm:max-w-[425px] md:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Edit Collection</DialogTitle>
          <DialogDescription>
            Update the collection name, description, and icon.
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

          <DialogFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Collection"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
