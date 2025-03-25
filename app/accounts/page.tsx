"use client"

import type React from "react"

import { useState, useRef } from "react"
import { AppSidebar } from "../../components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  Edit,
  Trash,
  FolderIcon as FolderMove,
} from "lucide-react"

// Generate a larger sample dataset
const generateAccounts = (count) => {
  const categories = ["Personal", "Business", "Marketing", "Research", "Development", "Testing", "Admin"]
  const statuses = ["logged-in", "logged-out"]
  const usernamePrefixes = [
    "User",
    "Account",
    "Profile",
    "Tech",
    "Dev",
    "Admin",
    "Test",
    "Marketing",
    "Research",
    "Business",
  ]
  const usernameSuffixes = ["Pro", "Master", "Expert", "Ninja", "Guru", "Wizard", "Star", "Hero", "Champion", "Ace"]

  return Array.from({ length: count }).map((_, index) => {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    const randomPrefix = usernamePrefixes[Math.floor(Math.random() * usernamePrefixes.length)]
    const randomSuffix = usernameSuffixes[Math.floor(Math.random() * usernameSuffixes.length)]

    return {
      id: index + 1,
      username: `${randomPrefix}${randomSuffix}${index}`,
      proxy: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}:${8000 + Math.floor(Math.random() * 2000)}:user${index}:pass${index}`,
      status: randomStatus,
      category: randomCategory,
    }
  })
}

// Generate 500 sample accounts
const initialAccounts = generateAccounts(500)

// Available categories
const categories = ["All", "Personal", "Business", "Marketing", "Research", "Development", "Testing", "Admin"]
const categoriesWithoutAll = categories.filter((cat) => cat !== "All")

// Available page size options
const pageSizeOptions = [10, 25, 50, 100, 500]

// CSV template content
const csvTemplateContent = `username,proxy
Pimboto,192.168.1.1:8080:user:pass
TechUser,10.0.0.1:3128:admin:secure`

export default function AccountsPage() {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [csvContent, setCsvContent] = useState("")
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentAccount, setCurrentAccount] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({ username: "", proxy: "" })
  const [newCategory, setNewCategory] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter accounts by category
  const filteredAccounts =
    selectedCategory === "All" ? accounts : accounts.filter((account) => account.category === selectedCategory)

  // Calculate pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + itemsPerPage)

  // Handle page size change
  const handlePageSizeChange = (newSize: string) => {
    const size = Number.parseInt(newSize)
    setItemsPerPage(size)
    // Reset to first page when changing page size to avoid empty pages
    setCurrentPage(1)
  }

  // Handle CSV import from text
  const handleImport = () => {
    if (!csvContent.trim()) return

    const lines = csvContent.trim().split("\n")
    if (lines.length < 2) return

    const newAccounts = lines.slice(1).map((line, index) => {
      const [username, proxy] = line.split(",").map((item) => item.trim())
      return {
        id: accounts.length + index + 1,
        username,
        proxy,
        status: "logged-out",
        category: "Imported",
      }
    })

    setAccounts([...accounts, ...newAccounts])
    setCsvContent("")
    setIsImportDialogOpen(false)
  }

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvContent(content)
    }
    reader.readAsText(file)
  }

  // Download CSV template
  const handleDownloadTemplate = () => {
    const element = document.createElement("a")
    const file = new Blob([csvTemplateContent], { type: "text/csv" })
    element.href = URL.createObjectURL(file)
    element.download = "accounts_template.csv"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Edit account
  const handleEditAccount = () => {
    if (!currentAccount) return

    const updatedAccounts = accounts.map((account) =>
      account.id === currentAccount.id
        ? { ...account, username: editFormData.username, proxy: editFormData.proxy }
        : account,
    )

    setAccounts(updatedAccounts)
    setIsEditDialogOpen(false)
  }

  // Change account category
  const handleChangeCategory = () => {
    if (!currentAccount || !newCategory) return

    const updatedAccounts = accounts.map((account) =>
      account.id === currentAccount.id ? { ...account, category: newCategory } : account,
    )

    setAccounts(updatedAccounts)
    setIsCategoryDialogOpen(false)
  }

  // Delete account
  const handleDeleteAccount = () => {
    if (!currentAccount) return

    const updatedAccounts = accounts.filter((account) => account.id !== currentAccount.id)
    setAccounts(updatedAccounts)
    setIsDeleteDialogOpen(false)
  }

  // Open edit dialog
  const openEditDialog = (account: any) => {
    setCurrentAccount(account)
    setEditFormData({ username: account.username, proxy: account.proxy })
    setIsEditDialogOpen(true)
  }

  // Open category dialog
  const openCategoryDialog = (account: any) => {
    setCurrentAccount(account)
    setNewCategory(account.category)
    setIsCategoryDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (account: any) => {
    setCurrentAccount(account)
    setIsDeleteDialogOpen(true)
  }

  // Go to specific page
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate middle pages
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if at the beginning or end
      if (currentPage <= 2) {
        endPage = 4
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3
      }

      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push("...")
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push("...")
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Main</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Accounts</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Account Management</h1>

            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]" size="sm">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Accounts
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Accounts</DialogTitle>
                    <DialogDescription>
                      Upload a CSV file with account information. Format: username, proxy (e.g., "Pimboto,
                      ip:host:port:pass")
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="flex justify-between items-center">
                      <Button size="sm" variant="outline" onClick={handleDownloadTemplate}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Template
                      </Button>

                      <div>
                        <input
                          type="file"
                          accept=".csv"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload CSV
                        </Button>
                      </div>
                    </div>

                    <Label htmlFor="csv-content">CSV Content</Label>
                    <textarea
                      id="csv-content"
                      className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="username, proxy
Pimboto, 192.168.1.1:8080:user:pass"
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                    />
                  </div>

                  <DialogFooter>
                    <Button size="sm" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleImport}>
                      Import
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Proxy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No accounts found. Try changing the filter or import some accounts.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.username}</TableCell>
                      <TableCell className="font-mono text-sm">{account.proxy}</TableCell>
                      <TableCell>
                        <Badge variant={account.status === "logged-in" ? "success" : "secondary"}>
                          {account.status === "logged-in" ? "Logged In" : "Logged Out"}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.category}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(account)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openCategoryDialog(account)}>
                              <FolderMove className="mr-2 h-4 w-4" />
                              Change Category
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(account)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Enhanced Pagination */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="page-size" className="text-sm">
                Show
              </Label>
              <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger id="page-size" className="w-[80px]" size="sm">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm">per page</span>
              <span className="text-sm text-muted-foreground ml-4">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAccounts.length)} of{" "}
                {filteredAccounts.length}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center">
                {getPageNumbers().map((page, index) =>
                  typeof page === "number" ? (
                    <Button
                      key={index}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0 mx-1"
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </Button>
                  ) : (
                    <span key={index} className="mx-1">
                      ...
                    </span>
                  ),
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                value={editFormData.username}
                onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="proxy" className="text-right">
                Proxy
              </Label>
              <Input
                id="proxy"
                value={editFormData.proxy}
                onChange={(e) => setEditFormData({ ...editFormData, proxy: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleEditAccount}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
            <DialogDescription>Move this account to a different category.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesWithoutAll.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleChangeCategory}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account "{currentAccount?.username}" and
              remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button size="sm" variant="outline">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button size="sm" variant="destructive" onClick={handleDeleteAccount}>
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}

