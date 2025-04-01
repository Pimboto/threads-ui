// app/accounts/components/EditAccountDialog.tsx
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Account } from "@/lib/services/accounts-service"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentAccount: Account | null

  accounts: Account[]
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>
}

export function EditAccountDialog({
  open,
  onOpenChange,
  currentAccount,
  accounts,
  setAccounts,
}: Props) {
  const [username, setUsername] = useState("")
  const [proxy, setProxy] = useState("")

  useEffect(() => {
    if (currentAccount) {
      setUsername(currentAccount.username || "")
      setProxy(currentAccount.proxy || "")
    }
  }, [currentAccount])

  function handleEditAccount() {
    if (!currentAccount) return

    // Aquí podrías llamar a tu servicio para actualizar en backend
    // Por simplicidad, solo actualizamos en local:
    const updatedAccounts = accounts.map((acc) =>
      acc.id === currentAccount.id
        ? { ...acc, username, proxy }
        : acc
    )
    setAccounts(updatedAccounts)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>Make changes to the account details.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="proxy" className="text-right">
              Proxy
            </Label>
            <Input
              id="proxy"
              value={proxy}
              onChange={(e) => setProxy(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleEditAccount}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
