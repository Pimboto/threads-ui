// app/accounts/components/DeleteAccountAlert.tsx
"use client"

import React from "react"
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
import { Account } from "@/lib/services/accounts-service"

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
  function handleDelete() {
    if (!currentAccount) return
    // Eliminar en local
    const updated = accounts.filter((acc) => acc.id !== currentAccount.id)
    setAccounts(updated)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the account "
            {currentAccount?.username}" and remove it from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
