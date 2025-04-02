//app\post\components\ScheduledPostsTab.tsx
"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"

// Actualizar la interfaz para manejar tanto el formato recibido del backend como el generado localmente
interface ScheduledPost {
  id?: number;                    // Para posts creados localmente
  content?: string;               // Para posts creados localmente
  postText?: string;              // Para posts del backend
  category?: string;              // Para posts creados localmente
  categoryId?: string;            // Para posts del backend
  scheduledFor?: Date;            // Para posts creados localmente
  time?: string;                  // Para posts del backend (formato "HH:MM AM/PM")
  username?: string;              // Para posts del backend
  status?: string;                // Estado: pending, completed, etc.
}

interface ScheduledPostsTabProps {
  scheduledPosts: ScheduledPost[];
  onClearCompleted: () => void;
  onUpdatePosts: (posts: ScheduledPost[]) => void;
}

export function ScheduledPostsTab({ 
  scheduledPosts, 
  onClearCompleted, 
  onUpdatePosts 
}: ScheduledPostsTabProps) {
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [processedPosts, setProcessedPosts] = useState<ScheduledPost[]>([])

  // Procesar los posts al cargar el componente
  useEffect(() => {
    const processed = scheduledPosts.map(post => {
      // Determinar si el post está en el pasado
      const isPast = isPostInPast(post)
      
      return {
        ...post,
        // Asegurar que tengamos content (para compatibilidad)
        content: post.content || post.postText,
        // Actualizar estado basado en si está en el pasado
        status: isPast ? "completed" : (post.status || "pending")
      }
    })
    
    setProcessedPosts(processed)
  }, [scheduledPosts])

  // Verificar si un post está en el pasado
  const isPostInPast = (post: ScheduledPost) => {
    const now = new Date()
    
    // Manejar tanto posts con scheduledFor como con time
    if (post.scheduledFor) {
      return post.scheduledFor < now
    } else if (post.time) {
      // Convertir la hora en formato "HH:MM AM/PM" a un objeto Date para comparación
      try {
        const today = new Date()
        const [time, period] = post.time.split(' ')
        const [hours, minutes] = time.split(':')
        
        let hour = parseInt(hours, 10)
        if (period.toUpperCase() === 'PM' && hour < 12) {
          hour += 12
        } else if (period.toUpperCase() === 'AM' && hour === 12) {
          hour = 0
        }
        
        today.setHours(hour, parseInt(minutes, 10), 0, 0)
        return today < now
      } catch (error) {
        console.error("Error parsing time:", error)
        return false
      }
    }
    
    return false
  }

  // Formatear la hora/fecha para mostrar
  const formatScheduledTime = (post: ScheduledPost) => {
    try {
      // Si ya tenemos la hora en formato string, usarla directamente
      if (post.time) {
        return post.time
      }
      
      // Si tenemos un objeto Date, formatearlo
      if (post.scheduledFor && post.scheduledFor instanceof Date) {
        return format(post.scheduledFor, "h:mm a")
      }
      
      return "N/A"
    } catch (error) {
      console.error("Error formatting time:", error, post)
      return "N/A"
    }
  }

  // Manejar el borrado de posts completados
  const handleClearCompleted = () => {
    onClearCompleted()
    setIsClearDialogOpen(false)

    toast({
      title: "Completed posts cleared",
      description: "All completed posts have been removed from the list",
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Scheduled Posts</CardTitle>
            <CardDescription>View and manage your scheduled posts.</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsClearDialogOpen(true)}
            disabled={!processedPosts.some((post) => post.status === "completed")}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Completed
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Scheduled Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No scheduled posts found. Create a new post to get started.
                  </TableCell>
                </TableRow>
              ) : (
                processedPosts.map((post, index) => (
                  <TableRow key={`post-${post.id ?? ''}-${post.username ?? ''}-${post.time ?? ''}-${index}`}>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {post.content ?? post.postText}
                    </TableCell>
                    <TableCell>{post.username ?? 'Multiple Accounts'}</TableCell>
                    <TableCell>{formatScheduledTime(post)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={post.status === "completed" ? "success" : "secondary"}
                      >
                        {post.status === "completed" ? "Completed" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Clear Completed Confirmation Dialog */}
      {isClearDialogOpen && (
        <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Completed Posts?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all completed posts from the list. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button size="sm" variant="outline">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button size="sm" onClick={handleClearCompleted}>
                  Clear
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
