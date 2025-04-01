// app/accounts/page.tsx
"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "../../components/app-sidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbLink,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { toast } from "@/hooks/use-toast"

import { accountsService, Account, Category } from "@/lib/services/accounts-service"

// Componentes parciales
import { AccountsTable } from "./components/AccountsTable"
import { ImportAccountsDialog } from "./components/ImportAccountsDialog"
import { CategoryEditorDialog } from "./components/CategoryEditorDialog"
import { DeleteCategoryAlert } from "./components/DeleteCategoryAlert"

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // ID de categoría a eliminar
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null)

  // Para manejar el diálogo de gestionar categorías
  const [isCategoryEditorOpen, setIsCategoryEditorOpen] = useState(false)

  // Para manejar el diálogo de importar cuentas
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  // Carga inicial de datos
  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    try {
      const fetchedAccounts = await accountsService.getAccounts()
      setAccounts(fetchedAccounts)

      const fetchedCategories = await accountsService.getCategories()
      setCategories(fetchedCategories)
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to load accounts or categories",
        variant: "destructive",
      })
    }
  }

  // Confirmar borrado de categoría
  function confirmDeleteCategory(id: string) {
    setCategoryToDeleteId(id)
  }

  // Cerrar alert de borrado sin acción
  function cancelDeleteCategory() {
    setCategoryToDeleteId(null)
  }

  // Maneja el borrado final de la categoría
  async function handleDeleteCategory() {
    if (!categoryToDeleteId) return

    try {
      // Buscamos la categoría en el estado
      const catToDelete = categories.find((c) => c.id === categoryToDeleteId)
      if (!catToDelete) {
        toast({
          title: "Error",
          description: "Category not found",
          variant: "destructive",
        })
        return
      }

      await accountsService.deleteCategory(catToDelete.id!)

      // Actualizamos las categorías localmente
      setCategories((prev) => prev.filter((cat) => cat.id !== catToDelete.id))

      // Movemos las cuentas de esa categoría a "Imported"
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.category === catToDelete.name
            ? { ...acc, category: "Imported" }
            : acc
        )
      )

      setCategoryToDeleteId(null)
      toast({
        title: "Category deleted",
        description: `Category "${catToDelete.name}" was deleted successfully.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Unable to delete category",
        variant: "destructive",
      })
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 items-center gap-2 border-b px-4">
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

        {/* Contenido principal */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* TABLA Y FILTROS DE ACCOUNTS */}
          <AccountsTable
            accounts={accounts}
            setAccounts={setAccounts}
            categories={categories}
            onOpenCategoryEditor={() => setIsCategoryEditorOpen(true)}
            onOpenImportDialog={() => setIsImportDialogOpen(true)}
          />
        </div>
      </SidebarInset>

      {/* DIALOGO DE GESTION DE CATEGORIAS */}
      <CategoryEditorDialog
        open={isCategoryEditorOpen}
        onOpenChange={setIsCategoryEditorOpen}
        categories={categories}
        setCategories={setCategories}
        accounts={accounts}
        setAccounts={setAccounts}
        onConfirmDelete={confirmDeleteCategory}
      />

      {/* ALERT DIALOG DE BORRAR CATEGORIA */}
      <DeleteCategoryAlert
        categoryToDeleteId={categoryToDeleteId}
        onCancel={cancelDeleteCategory}
        onDelete={handleDeleteCategory}
      />

      {/* DIALOGO DE IMPORTAR CUENTAS */}
      <ImportAccountsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        accounts={accounts}
        setAccounts={setAccounts}
      />
    </SidebarProvider>
  )
}
