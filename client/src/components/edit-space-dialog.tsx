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

const editSpaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().default("folder"),
})

type EditSpaceForm = z.infer<typeof editSpaceSchema>

interface EditSpaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: EditSpaceForm) => void
  onDelete: () => void
  space: Space | null
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

export function EditSpaceDialog({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  space,
  isDeleting = false,
}: EditSpaceDialogProps) {
  const form = useForm<EditSpaceForm>({
    resolver: zodResolver(editSpaceSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "folder",
    },
  })

  // Update form when space changes
  React.useEffect(() => {
    if (space) {
      form.reset({
        name: space.name,
        description: space.description || "",
        icon: space.icon || "folder",
      })
    }
  }, [space, form])

  const handleSubmit = (data: EditSpaceForm) => {
    onSubmit(data)
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${space?.name}"? This will also delete all collections and bookmarks within this space.`)) {
      onDelete()
    }
  }

  if (!space) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Space</DialogTitle>
          <DialogDescription>
            Update the space name, description, and icon.
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

          <DialogFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Space"}
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
