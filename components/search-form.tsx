import type React from "react"
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar"

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  return (
    <form {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">{/* Search input removed as requested */}</SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}

