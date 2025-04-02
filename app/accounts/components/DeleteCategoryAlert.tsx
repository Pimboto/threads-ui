// app/accounts/components/DeleteCategoryAlert.tsx
"use client"

import React, { useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

interface Props {
  categoryToDeleteId: string | null

  onCancel: () => void
  onDelete: () => Promise<void>
}

export function DeleteCategoryAlert({
  categoryToDeleteId,
  onCancel,
  onDelete,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false)
  const open = !!categoryToDeleteId

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
      toast({
        title: "Category Deleted",
        description: "The category has been successfully deleted.",
      })
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the category permanently. Any accounts in this category will be moved to "Imported".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
