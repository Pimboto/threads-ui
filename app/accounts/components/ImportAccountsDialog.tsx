// app/accounts/components/ImportAccountsDialog.tsx
"use client"

import React, { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"

import { toast } from "@/hooks/use-toast"
import { Account } from "@/lib/services/accounts-service"

const extensionToCategory: Record<string, string> = {
  lolanna: "Personal",
  lolaaa: "Business",
  lol: "Marketing",
  default: "Imported",
}

interface ImportAccountsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  accounts: Account[]
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>
}

export function ImportAccountsDialog({
  open,
  onOpenChange,
  accounts,
  setAccounts,
}: ImportAccountsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Lista de archivos seleccionados
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  // Preview de las cuentas a importar
  const [previewAccounts, setPreviewAccounts] = useState<any[]>([])
  // Errores
  const [importErrors, setImportErrors] = useState<string[]>([])
  // Loading
  const [loading, setLoading] = useState(false)
  // Mostrar/ocultar el “preview”
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const filesArray = Array.from(e.target.files)
    setSelectedFiles(filesArray)
    processFilesForPreview(filesArray)
  }

  async function processFilesForPreview(files: File[]) {
    setLoading(true)
    const errors: string[] = []
    const previewList: any[] = []

    for (const file of files) {
      try {
        const filename = file.name
        const lastDotIndex = filename.lastIndexOf(".")
        if (lastDotIndex === -1) {
          errors.push(`File "${filename}" has no extension`)
          continue
        }

        const username = filename.substring(0, lastDotIndex)
        const extension = filename.substring(lastDotIndex + 1)
        const category = extensionToCategory[extension] || extensionToCategory.default
        const proxy = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}:${
          8000 + Math.floor(Math.random() * 2000)
        }:user:pass`

        previewList.push({
          username,
          extension,
          category,
          proxy,
          status: "logged-out",
        })
      } catch (err: any) {
        errors.push(`Error processing file: ${err.message}`)
      }
    }

    setPreviewAccounts(previewList)
    setImportErrors(errors)
    setLoading(false)
    if (previewList.length > 0) {
      setIsPreviewOpen(true)
    }
  }

  function removeFile(index: number) {
    const newFiles = [...selectedFiles]
    newFiles.splice(index, 1)
    setSelectedFiles(newFiles)
    if (newFiles.length > 0) processFilesForPreview(newFiles)
    else {
      setPreviewAccounts([])
      setImportErrors([])
    }
  }

  function clearFiles() {
    setSelectedFiles([])
    setPreviewAccounts([])
    setImportErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleImportAccounts() {
    if (previewAccounts.length === 0) {
      toast({
        title: "Error",
        description: "No valid accounts to import",
        variant: "destructive",
      })
      return
    }
    // Generamos nuevos objetos de cuenta
    const newAccounts: Account[] = previewAccounts.map((acc, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      username: acc.username,
      proxy: acc.proxy,
      status: acc.status,
      category: acc.category,
    }))

    // Añadirlos al estado
    setAccounts([...accounts, ...newAccounts])

    clearFiles()
    setIsPreviewOpen(false)
    onOpenChange(false)

    toast({
      title: "Accounts imported",
      description: `${newAccounts.length} accounts imported successfully`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Accounts</DialogTitle>
          <DialogDescription>
            Upload account files to import them. Each file will be imported as a separate account.
          </DialogDescription>
        </DialogHeader>

        {/* Sección para subir archivos */}
        <div className="grid gap-4 py-4">
          <div className="rounded-md border-2 border-dashed p-6 text-center">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="*"
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="flex flex-col items-center gap-1">
                <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="h-auto p-1">
                  <span className="text-primary font-medium">Click to upload</span>
                </Button>
                <span className="text-xs text-muted-foreground">or drag and drop files here</span>
              </div>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Selected Files ({selectedFiles.length})</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFiles}
                  className="h-6 px-2 text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border p-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm p-1 rounded hover:bg-muted"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-md border p-3 bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4" />
              <h3 className="text-sm font-medium">File Format</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Each file should be named with the format:{" "}
              <span className="font-mono">username.extension</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">The extension will determine the category:</p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 list-disc pl-5">
              <li>
                <span className="font-mono">.lolanna</span> - Personal
              </li>
              <li>
                <span className="font-mono">.lolaaa</span> - Business
              </li>
              <li>
                <span className="font-mono">.lol</span> - Marketing
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => processFilesForPreview(selectedFiles)}
            disabled={selectedFiles.length === 0 || loading}
          >
            {loading ? "Processing..." : "Preview Accounts"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Preview sub-dialog si quieres */}
      {isPreviewOpen && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Accounts</DialogTitle>
              <DialogDescription>Review the accounts that will be imported from your files.</DialogDescription>
            </DialogHeader>

            {importErrors.length > 0 && (
              <div className="mb-4 p-3 border border-destructive/50 rounded-md bg-destructive/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <h3 className="text-sm font-medium text-destructive">Errors Found</h3>
                </div>
                <ul className="text-xs text-destructive space-y-1 ml-6 list-disc">
                  {importErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {previewAccounts.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Extension</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Proxy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewAccounts.map((acc, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{acc.username}</TableCell>
                          <TableCell>{acc.extension}</TableCell>
                          <TableCell>{acc.category}</TableCell>
                          <TableCell className="font-mono text-xs">{acc.proxy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <p className="text-sm">
                    {previewAccounts.length} account
                    {previewAccounts.length !== 1 ? "s" : ""} ready to be imported
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {importErrors.length > 0 ? (
                  <p>Please fix the errors in your files and try again.</p>
                ) : (
                  <p>No valid accounts found in the selected files.</p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleImportAccounts}
                disabled={previewAccounts.length === 0}
              >
                Import {previewAccounts.length} Account
                {previewAccounts.length !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
