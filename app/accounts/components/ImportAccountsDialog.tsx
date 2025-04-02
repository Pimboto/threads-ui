"use client"

import React, { useRef, useState } from "react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { toast } from "@/hooks/use-toast"
import { Account } from "@/lib/services/accounts-service"
import axios from "axios"

// Tipos para la importación de cuentas
interface ImportAccount {
  device: {
    resolution: string
    density: string
    model: string
    manufacturer: string
    brand: string
    codename: string
    device: string
    language: string
    'build-number': string
    'os-version': string
  }
  session: {
    username: string
    password: string
    't-otp-key'?: string
    proxy: string
    // Ahora permitimos cualquier otra propiedad en el objeto session
    [key: string]: any
  }
}

interface ImportResult {
  username: string
  success: boolean
  error?: string
  message?: string
}

interface ImportAccountsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>
  categoryId?: string
}

export function ImportAccountsDialog({
  open,
  onOpenChange,
  accounts,
  setAccounts,
  categoryId
}: ImportAccountsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewAccounts, setPreviewAccounts] = useState<ImportAccount[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [importResults, setImportResults] = useState<ImportResult[]>([])
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
    const parsedAccounts: ImportAccount[] = []

    for (const file of files) {
      try {
        const content = await file.text()
        let parsedContent

        // Manejar diferentes tipos de archivo
        if (file.name.endsWith('.json')) {
          parsedContent = JSON.parse(content)
        } else if (file.name.endsWith('.txt')) {
          try {
            // Intentar parsear el contenido como JSON aunque sea .txt
            parsedContent = JSON.parse(content)
          } catch (err) {
            errors.push(`Error processing text file ${file.name}: Not a valid JSON format`)
            continue
          }
        } else {
          errors.push(`Unsupported file type: ${file.name}`)
          continue
        }
        
        // Validación de la estructura del archivo
        // Verificar si los datos están en la raíz o dentro de sessionData
        let deviceData
        let sessionData

        if (parsedContent.device) {
          // Formato directo como en tu ejemplo de endpoint
          deviceData = parsedContent.device
          sessionData = parsedContent.session
        } else if (parsedContent.sessionData) {
          // Formato como el de la cuenta guardada
          deviceData = parsedContent.sessionData.device
          sessionData = parsedContent.sessionData.session
        } else {
          // Si tiene username y deviceModel, podría ser el formato completo
          if (parsedContent.username && parsedContent.deviceModel) {
            // Intentar reconstruir la estructura esperada
            deviceData = {
              resolution: "",
              density: "",
              model: parsedContent.deviceModel,
              manufacturer: parsedContent.deviceManufacturer || "",
              brand: "",
              codename: "",
              device: "",
              language: "en_US",
              'build-number': "",
              'os-version': ""
            }
            
            sessionData = {
              username: parsedContent.username,
              password: parsedContent.password,
              proxy: parsedContent.proxy || "",
              't-otp-key': parsedContent.totp || ""
            }
          } else {
            errors.push(`Invalid file format: ${file.name}`)
            continue
          }
        }

        // Verificar información mínima requerida
        if (!deviceData || !sessionData || !sessionData.username) {
          errors.push(`Missing required data in file: ${file.name}`)
          continue
        }

        // Crear el objeto cuenta con toda la información de la sesión
        parsedAccounts.push({
          device: deviceData,
          session: sessionData
        })
      } catch (err: any) {
        errors.push(`Error processing file ${file.name}: ${err.message}`)
      }
    }

    setPreviewAccounts(parsedAccounts)
    setImportErrors(errors)
    setLoading(false)

    if (parsedAccounts.length > 0) {
      setIsPreviewOpen(true)
    }
  }

  async function handleImportAccounts() {
    if (previewAccounts.length === 0) {
      toast({
        title: "Error",
        description: "No accounts to import",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3090/api'
      
      // Preparar el payload para la API de importación masiva
      const payload = {
        accounts: previewAccounts,
        ...(categoryId && { categoryId })  // Añadir categoryId opcional
      }

      const response = await axios.post(`${API_BASE_URL}/accounts/import/bulk`, payload)
      
      // Procesar los resultados de la importación
      const results: ImportResult[] = response.data
      setImportResults(results)

      // Filtrar las cuentas importadas exitosamente
      const successfulImports = results
        .filter(result => result.success)
        .map(result => ({
          id: `temp-${Date.now()}-${result.username}`,
          username: result.username,
          category: categoryId ? 
            { id: categoryId, name: 'Imported' } 
            : { id: 'temp', name: 'Imported' },
          status: 'logged-out',
          proxy: previewAccounts.find(acc => acc.session.username === result.username)?.session.proxy || ''
        }))

      // Actualizar el estado de cuentas
      if (successfulImports.length > 0) {
        setAccounts(prev => [...prev, ...successfulImports])
      }

      // Mostrar toast con resultados
      toast({
        title: "Import Results",
        description: `Imported ${successfulImports.length} out of ${previewAccounts.length} accounts`,
        variant: successfulImports.length === previewAccounts.length ? "default" : "destructive"
      })

      // Limpiar estado
      clearImportState()
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Error",
        description: "Failed to import accounts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  function clearImportState() {
    setSelectedFiles([])
    setPreviewAccounts([])
    setImportErrors([])
    setImportResults([])
    setIsPreviewOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onOpenChange(false)
  }

  function removeFile(index: number) {
    const newFiles = [...selectedFiles]
    newFiles.splice(index, 1)
    setSelectedFiles(newFiles)
    
    if (newFiles.length > 0) {
      processFilesForPreview(newFiles)
    } else {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Accounts</DialogTitle>
          <DialogDescription>
            Upload JSON or TXT files containing account session and device details
          </DialogDescription>
        </DialogHeader>

        {/* File Upload Section */}
        <div className="grid gap-4 py-4">
          <div className="rounded-md border-2 border-dashed p-6 text-center">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".json,.txt"
            />
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="flex flex-col items-center gap-1">
                <Button 
                  variant="ghost" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="h-auto p-1"
                >
                  <span className="text-primary font-medium">Click to upload JSON or TXT files</span>
                </Button>
                <span className="text-xs text-muted-foreground">
                  Each file should contain a full account session payload
                </span>
              </div>
            </div>
          </div>

          {/* Selected Files List */}
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

          {/* Error Display */}
          {importErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <h3 className="text-sm font-medium text-destructive">
                  Errors Found
                </h3>
              </div>
              <ul className="text-xs text-destructive space-y-1 ml-6 list-disc">
                {importErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleImportAccounts}
            disabled={previewAccounts.length === 0 || loading}
          >
            {loading ? "Importing..." : `Import ${previewAccounts.length} Accounts`}
          </Button>
        </DialogFooter>

        {/* Preview Modal */}
        {isPreviewOpen && (
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Preview Imported Accounts</DialogTitle>
                <DialogDescription>
                  Review the accounts that will be imported
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Proxy</TableHead>
                      <TableHead>Session Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewAccounts.map((account, index) => (
                      <TableRow key={index}>
                        <TableCell>{account.session.username}</TableCell>
                        <TableCell>
                          {account.device.model} ({account.device.manufacturer})
                        </TableCell>
                        <TableCell>{account.session.proxy}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="mr-1">
                            {Object.keys(account.session).length} fields
                          </Badge>
                          {account.session['pigeon-session-id'] && 
                            <Badge variant="secondary" className="mr-1">Full Session</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Close Preview
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
