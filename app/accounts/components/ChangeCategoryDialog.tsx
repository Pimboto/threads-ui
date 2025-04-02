// app/accounts/components/ChangeCategoryDialog.tsx
"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Account, Category, accountsService } from "@/lib/services/accounts-service"
import { toast } from "@/hooks/use-toast"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentAccount: Account | null

  accounts: Account[]
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>
  categories: Category[]
}

export function ChangeCategoryDialog({
  open,
  onOpenChange,
  currentAccount,
  accounts,
  setAccounts,
  categories,
}: Props) {
  const [newCategory, setNewCategory] = useState("")
  const [isChanging, setIsChanging] = useState(false)

  // Reset new category when account changes
  useEffect(() => {
    if (currentAccount) {
      setNewCategory(currentAccount.category || "")
    }
  }, [currentAccount])

  async function handleChangeCategory() {
    if (!currentAccount || !newCategory) return

    try {
      setIsChanging(true)

      // Find the selected category
      const selectedCategory = categories.find(cat => cat.name === newCategory)
      
      if (!selectedCategory) {
        throw new Error("Selected category not found")
      }

      // Call the service method to add account to category
      await accountsService.addAccountsToCategory(
        selectedCategory.id!, 
        [currentAccount.username]
      )

      // Update local state
      const updatedAccounts = accounts.map((acc) =>
        acc.username === currentAccount.username
          ? { ...acc, category: newCategory }
          : acc
      )
      setAccounts(updatedAccounts)

      // Close dialog
      onOpenChange(false)

      // Show success toast
      toast({
        title: "Category Updated",
        description: `Account "${currentAccount.username}" moved to "${newCategory}" category.`,
      })
    } catch (error) {
      console.error('Failed to change category:', error)
      
      toast({
        title: "Error",
        description: "Failed to change account category. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsChanging(false)
    }
  }

  // Get category names, excluding the current category
  const categoryNames = categories
    .map(c => c.name)
    .filter(name => name !== currentAccount?.category)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Category</DialogTitle>
          <DialogDescription>
            Move the account "{currentAccount?.username}" to a different category.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select 
              value={newCategory} 
              onValueChange={setNewCategory}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryNames.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isChanging}
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleChangeCategory}
            disabled={!newCategory || isChanging}
          >
            {isChanging ? "Changing..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
