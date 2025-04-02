// app/accounts/components/DeleteAccountAlert.tsx
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
import { Account, accountsService } from "@/lib/services/accounts-service"
import { toast } from "@/hooks/use-toast"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void

  currentAccount: Account | null

  accounts: Account[]
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>
}

export function DeleteAccountAlert({
  open,
  onOpenChange,
  currentAccount,
  accounts,
  setAccounts,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!currentAccount?.username) return

    try {
      setIsDeleting(true)
      
      // Call the delete service method
      await accountsService.deleteAccount(currentAccount.username)

      // Update local state by filtering out the deleted account
      const updatedAccounts = accounts.filter((acc) => acc.username !== currentAccount.username)
      setAccounts(updatedAccounts)

      // Close the dialog
      onOpenChange(false)

      // Show success toast
      toast({
        title: "Account Deleted",
        description: `Account "${currentAccount.username}" has been deleted successfully.`,
      })
    } catch (error) {
      // Handle potential errors
      console.error('Failed to delete account:', error)
      
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the account "{currentAccount?.username}" 
            and remove it from our servers.
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
