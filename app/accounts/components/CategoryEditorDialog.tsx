// app/accounts/components/CategoryEditorDialog.tsx
"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, Edit2, Trash, X, CheckCircle2 } from "lucide-react"
import { Category, Account, accountsService } from "@/lib/services/accounts-service"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void

  categories: Category[]
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>
  accounts: Account[]
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>

  // Para disparar el Alert de borrado, aunque aquí podemos hacerlo con callback
  onConfirmDelete: (id: string) => void
}

export function CategoryEditorDialog({
  open,
  onOpenChange,
  categories,
  setCategories,
  accounts,
  setAccounts,
  onConfirmDelete,
}: Props) {
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState("")

  async function handleAddCategory() {
    const name = newCategoryName.trim()
    if (!name) return

    if (categories.some((c) => c.name === name)) {
      toast({
        title: "Error",
        description: "This category already exists",
        variant: "destructive",
      })
      return
    }

    try {
      const created = await accountsService.createCategory({
        name,
        description: "",
      })
      setCategories((prev) => [...prev, created])
      setNewCategoryName("")
      toast({
        title: "Success",
        description: `Category "${name}" created`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      })
    }
  }

  function startEditing(cat: Category) {
    setEditingCategoryId(cat.id!)
    setEditingCategoryName(cat.name)
  }

  function cancelEditing() {
    setEditingCategoryId(null)
    setEditingCategoryName("")
  }

  async function saveEditing() {
    if (!editingCategoryId) return
    const newName = editingCategoryName.trim()
    if (!newName) return

    // Verificar duplicados
    const catWithSameName = categories.find((c) => c.name === newName && c.id !== editingCategoryId)
    if (catWithSameName) {
      toast({
        title: "Error",
        description: "This category already exists",
        variant: "destructive",
      })
      return
    }

    // Buscar la categoría
    const catToEdit = categories.find((c) => c.id === editingCategoryId)
    if (!catToEdit) {
      toast({
        title: "Error",
        description: "Category not found",
        variant: "destructive",
      })
      return
    }

    try {
      const updated = await accountsService.updateCategory(catToEdit.id!, { name: newName })
      // Actualizar la lista en local
      setCategories((prev) => prev.map((c) => (c.id === catToEdit.id ? updated : c)))
      // Actualizar las cuentas que tienen la categoría vieja (por nombre)
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.category === catToEdit.name
            ? { ...acc, category: updated.name }
            : acc
        )
      )

      cancelEditing()
      toast({
        title: "Success",
        description: `Category updated to "${newName}"`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Add, edit, or delete account categories. Deleting a category will move associated accounts to "Imported".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="border rounded-md">
            <ScrollArea className="h-[300px]">
              <div className="p-1">
                {categories.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No categories found. Add your first category above.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                      >
                        {editingCategoryId === cat.id ? (
                          <Input
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="flex-1 mr-2"
                            autoFocus
                          />
                        ) : (
                          <span>{cat.name}</span>
                        )}

                        <div className="flex items-center gap-1">
                          {editingCategoryId === cat.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditing}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={saveEditing}
                                className="h-8 w-8 p-0"
                                disabled={!editingCategoryName.trim()}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(cat)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onConfirmDelete(cat.id!)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
