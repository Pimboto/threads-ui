"use client";

import React, { useState } from "react";
import {
  Filter,
  Pencil,
  MoreHorizontal,
  Edit,
  Trash,
  FolderIcon as FolderMove,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Account, Category } from "@/lib/services/accounts-service";

// Diálogos que estaban en el mismo archivo
import { EditAccountDialog } from "./EditAccountDialog";
import { ChangeCategoryDialog } from "./ChangeCategoryDialog";
import { DeleteAccountAlert } from "./DeleteAccountAlert";

interface AccountsTableProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  categories: Category[];

  // Para abrir los diálogos en el contenedor principal
  onOpenCategoryEditor: () => void;
  onOpenImportDialog: () => void;
}

export function AccountsTable({
  accounts,
  setAccounts,
  categories,
  onOpenCategoryEditor,
  onOpenImportDialog,
}: AccountsTableProps) {
  // Filtro de categoría
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const pageSizeOptions = [10, 25, 50, 100, 500];

  // Diálogos de editar cuenta, cambiar categoría, borrar cuenta
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Computados para la lista de categorías (como strings) + "All"
  const categoryNames = categories.map((c) => c.name);
  const categoriesWithAll = ["All", ...categoryNames];

  // Función para obtener el nombre de la categoría de una cuenta
  const getAccountCategoryName = (account: Account): string | undefined => {
    if (account.categories && account.categories.length > 0) {
      return account.categories[0].name;
    }
    return account.category; // Para compatibilidad con el código existente
  };

  // Filtrar las cuentas por categoría
  const filteredAccounts =
    selectedCategory === "All"
      ? accounts
      : accounts.filter((acc) => {
          const categoryName = getAccountCategoryName(acc);
          return categoryName === selectedCategory;
        });

  // Calcular paginación
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Funciones de paginación
  function handlePageSizeChange(newSize: string) {
    const size = Number.parseInt(newSize);
    setItemsPerPage(size);
    setCurrentPage(1);
  }

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  function getPageNumbers() {
    const pages: Array<number | string> = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        endPage = 4;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }

      if (startPage > 2) pages.push("...");
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (endPage < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  }

  // Abrir Diálogos
  function openEditDialog(acc: Account) {
    setCurrentAccount(acc);
    setIsEditDialogOpen(true);
  }
  function openCategoryDialog(acc: Account) {
    setCurrentAccount(acc);
    setIsCategoryDialogOpen(true);
  }
  function openDeleteDialog(acc: Account) {
    setCurrentAccount(acc);
    setIsDeleteDialogOpen(true);
  }

  // Abrir perfil de Threads
  function openThreadsProfile(username: string) {
    window.open(`https://www.threads.net/@${username}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      {/* Encabezado: Filtro y botones */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Account Management</h1>

        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categoriesWithAll.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCategoryEditor}
              className="flex items-center gap-1"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Manage</span>
            </Button>
          </div>

          {/* Botón para importar cuentas */}
          <Button size="sm" onClick={onOpenImportDialog}>
            Import Accounts
          </Button>
        </div>
      </div>

      {/* TABLA */}
      <div className="rounded-md border mt-4">
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
                  No accounts found. Try changing the filter or import some
                  accounts.
                </TableCell>
              </TableRow>
            ) : (
              paginatedAccounts.map((account, index) => (
                <TableRow key={account.id ?? `account-${startIndex + index}`}>
                  <TableCell className="font-medium">
                    {account.username}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {account.proxy ?? "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        account.status === "Active" ? "success" : "secondary"
                      }
                    >
                      {account.status === "Active" ? "Logged In" : "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getAccountCategoryName(account) ? (
                      <Badge variant="secondary">{getAccountCategoryName(account)}</Badge>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openEditDialog(account)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openCategoryDialog(account)}
                        >
                          <FolderMove className="mr-2 h-4 w-4" />
                          Change Category
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openThreadsProfile(account.username)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Threads Profile
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

      {/* PAGINACIÓN */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="page-size" className="text-sm">
            Show
          </Label>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger id="page-size" className="w-[80px]">
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
            Showing {startIndex + 1}-
            {Math.min(startIndex + itemsPerPage, filteredAccounts.length)} of{" "}
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
            Previous
          </Button>

          <div className="flex items-center">
            {getPageNumbers().map((page, index) =>
              typeof page === "number" ? (
                <Button
                  key={page}
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
              )
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Diálogos */}
      <EditAccountDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentAccount={currentAccount}
        accounts={accounts}
        setAccounts={setAccounts}
      />

      <ChangeCategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        currentAccount={currentAccount}
        accounts={accounts}
        setAccounts={setAccounts}
        categories={categories}
      />

      <DeleteAccountAlert
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        currentAccount={currentAccount}
        accounts={accounts}
        setAccounts={setAccounts}
      />
    </>
  );
}
