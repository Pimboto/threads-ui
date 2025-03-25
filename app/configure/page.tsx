"use client"

import type React from "react"

import { useState } from "react"
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

// Available categories (same as in accounts page)
const categories = ["Personal", "Business", "Marketing", "Research", "Development", "Testing", "Admin"]

export default function ConfigurePage() {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [bioContent, setBioContent] = useState("")
  const [linksContent, setLinksContent] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      })
      return
    }

    // Process the form data
    const bios = bioContent.split("\n").filter((bio) => bio.trim() !== "")
    const links = linksContent.split("\n").filter((link) => link.trim() !== "")

    // Here you would typically send this data to your backend
    console.log({
      category: selectedCategory,
      bios,
      links,
      isPrivate,
    })

    // Show success message
    toast({
      title: "Configuration saved",
      description: `Updated ${bios.length} bios and ${links.length} links for ${selectedCategory} accounts.`,
      action: <ToastAction altText="Undo">Undo</ToastAction>,
    })
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
                <BreadcrumbLink href="#">Automations</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Configure</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <h1 className="text-2xl font-bold">Account Configuration</h1>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Configure Accounts</CardTitle>
                <CardDescription>
                  Set up profiles for your accounts. Add bios, links, and privacy settings.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Account Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select the category of accounts you want to configure.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Enter bios (one per line)
bio1
bio2"
                    value={bioContent}
                    onChange={(e) => setBioContent(e.target.value)}
                    className="min-h-[120px] font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter one bio per line. These will be randomly assigned to accounts in the selected category.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="links">Links</Label>
                  <Textarea
                    id="links"
                    placeholder="Enter links (one per line)
links1.com
links2.com"
                    value={linksContent}
                    onChange={(e) => setLinksContent(e.target.value)}
                    className="min-h-[120px] font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter one link per line. These will be randomly assigned to accounts in the selected category.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="private-mode" checked={isPrivate} onCheckedChange={setIsPrivate} />
                  <Label htmlFor="private-mode">Make accounts private</Label>
                  <p className="text-sm text-muted-foreground ml-2">
                    {isPrivate ? "Accounts will be set to private mode" : "Accounts will be set to public mode"}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBioContent("")
                    setLinksContent("")
                    setIsPrivate(false)
                  }}
                >
                  Reset
                </Button>
                <Button type="submit" size="sm">
                  Save Configuration
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

