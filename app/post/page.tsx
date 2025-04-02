//app\post\page.tsx
"use client"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"

// Import new modular components
import { CreatePostTab } from "./components/CreatePostTab"
import { MassPostTab } from "./components/MassPostTab"
import { ScheduledPostsTab } from "./components/ScheduledPostsTab"

// Interfaz ScheduledPost actualizada para ser compatible con todos los componentes
interface ScheduledPost {
  id?: number;
  content?: string;
  postText?: string;
  category?: string;
  categoryId?: string;
  scheduledFor?: Date;
  time?: string;
  scheduledTime?: string;
  username?: string;
  status?: string;
}

// Interfaz para los datos recibidos del endpoint /api/posts/scheduled
interface ScheduledPostsResponse {
  success: boolean;
  data: {
    [username: string]: Array<{
      time: string;
      postText: string;
    }>;
  };
}

export default function PostPage() {
  const [activeTab, setActiveTab] = useState("create")
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  
  // Cargar los posts programados al montar el componente
  useEffect(() => {
    fetchScheduledPosts()
  }, [])

  // Función para obtener los posts programados del backend
  const fetchScheduledPosts = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3090/api'
      const response = await fetch(`${API_BASE_URL}/posts/scheduled`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled posts')
      }
      
      const data: ScheduledPostsResponse = await response.json()
      
      if (!data.success || !data.data) {
        return
      }
      
      // Transformar los datos del backend al formato que espera el componente
      const scheduledPostsArray: ScheduledPost[] = []
      
      // Recorrer cada usuario y sus posts
      Object.entries(data.data).forEach(([username, posts]) => {
        posts.forEach((post, index) => {
          scheduledPostsArray.push({
            // Usar un ID más único combinando tiempo actual, usuario y contenido
            id: Date.now() + index + username.length + post.postText.length,
            content: post.postText,
            postText: post.postText,
            time: post.time,
            username,
            status: 'pending'
          })
        })
      })
      
      setScheduledPosts(scheduledPostsArray)
    } catch (error) {
      console.error('Error fetching scheduled posts:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch scheduled posts',
        variant: 'destructive',
      })
    }
  }

  // Manejar creación de nuevo post
  const handlePostScheduled = (newPost: {
    categoryId: string;
    content: string;
    scheduledFor?: Date;
    randomDelayMinutes?: number;
  }) => {
    // Crear un nuevo post con el formato esperado por ScheduledPostsTab
    const scheduledPost: ScheduledPost = {
      id: Date.now() + Math.floor(Math.random() * 10000), // Más aleatorización
      content: newPost.content,
      categoryId: newPost.categoryId,
      scheduledFor: newPost.scheduledFor,
      status: "pending"
    }
    
    setScheduledPosts([...scheduledPosts, scheduledPost])
    setActiveTab("scheduled")
    
    // Refrescar los posts desde el backend para obtener los datos más actualizados
    setTimeout(() => {
      fetchScheduledPosts()
    }, 1000)
  }

  // Manejar importación masiva de posts
  const handlePostsImported = (newPosts: Array<{
    id: number;
    content: string;
    categoryId: string;
    scheduledTime: string;
    status: string;
  }>) => {
    // Convertir los posts importados al formato esperado
    const formattedPosts: ScheduledPost[] = newPosts.map(post => ({
      id: post.id,
      content: post.content,
      categoryId: post.categoryId,
      time: post.scheduledTime,
      status: post.status
    }))
    
    setScheduledPosts([...scheduledPosts, ...formattedPosts])
    setActiveTab("scheduled")
    
    // Refrescar los posts desde el backend para obtener los datos más actualizados
    setTimeout(() => {
      fetchScheduledPosts()
    }, 1000)
  }

  // Limpiar posts completados
  const handleClearCompleted = () => {
    const updatedPosts = scheduledPosts.filter((post) => post.status !== "completed")
    setScheduledPosts(updatedPosts)
  }

  // Actualizar los posts programados (para uso interno del componente ScheduledPostsTab)
  const handleUpdatePosts = (posts: ScheduledPost[]) => {
    setScheduledPosts(posts)
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
                <BreadcrumbPage>Post</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <h1 className="text-2xl font-bold">Post Management</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="create">Create Post</TabsTrigger>
              <TabsTrigger value="mass">Mass Post</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
              <CreatePostTab onPostScheduled={handlePostScheduled} />
            </TabsContent>

            <TabsContent value="mass">
              <MassPostTab onPostsImported={handlePostsImported} />
            </TabsContent>

            <TabsContent value="scheduled">
              <ScheduledPostsTab 
                scheduledPosts={scheduledPosts}
                onClearCompleted={handleClearCompleted}
                onUpdatePosts={handleUpdatePosts}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
