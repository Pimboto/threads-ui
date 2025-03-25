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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, Trash2, Upload, Download, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { format, parse } from "date-fns"
import { toast } from "@/hooks/use-toast"

// Available categories (same as in accounts page)
const categories = ["Personal", "Business", "Marketing", "Research", "Development", "Testing", "Admin"]

// Sample scheduled posts data
const initialScheduledPosts = [
  {
    id: 1,
    content: "Check out our new product launch!",
    category: "Marketing",
    scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
    status: "pending",
  },
  {
    id: 2,
    content: "Happy Monday everyone! Let's start the week with positive energy.",
    category: "Personal",
    scheduledFor: new Date(Date.now() + 7200000), // 2 hours from now
    status: "pending",
  },
  {
    id: 3,
    content: "Important system maintenance tonight at 2 AM EST.",
    category: "Admin",
    scheduledFor: new Date(Date.now() - 86400000), // 1 day ago
    status: "completed",
  },
  {
    id: 4,
    content: "We're hiring! Check out our careers page for open positions.",
    category: "Business",
    scheduledFor: new Date(Date.now() - 43200000), // 12 hours ago
    status: "completed",
  },
  {
    id: 5,
    content: "New research paper published on our website.",
    category: "Research",
    scheduledFor: new Date(Date.now() + 172800000), // 2 days from now
    status: "pending",
  },
]

// CSV template content for mass posting
const csvTemplateContent = `content,category,date,time
"Check out our new product launch!",Marketing,2023-12-25,14:30
"Happy holidays to all our customers!",Personal,2023-12-24,09:00
"New year sale starting soon!",Business,2023-12-31,23:59`

// Generate time options for the time selector
const timeOptions = Array.from({ length: 24 * 4 }).map((_, i) => {
  const hour = Math.floor(i / 4)
  const minute = (i % 4) * 15
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
})

export default function PostPage() {
  const [scheduledPosts, setScheduledPosts] = useState(initialScheduledPosts)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [postContent, setPostContent] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState("12:00")
  const [activeTab, setActiveTab] = useState("create")
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [isDateOpen, setIsDateOpen] = useState(false)
  const [isTimeOpen, setIsTimeOpen] = useState(false)
  const [csvContent, setCsvContent] = useState("")
  const [previewPosts, setPreviewPosts] = useState<any[]>([])
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [csvErrors, setCsvErrors] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Create a new scheduled post
  const handleCreatePost = () => {
    if (!selectedCategory || !postContent || !selectedDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return // Validation failed
    }

    // Parse the time
    const [hours, minutes] = selectedTime.split(":").map(Number)
    const scheduledDate = new Date(selectedDate)
    scheduledDate.setHours(hours, minutes)

    const newPost = {
      id: Date.now(),
      content: postContent,
      category: selectedCategory,
      scheduledFor: scheduledDate,
      status: "pending",
    }

    setScheduledPosts([...scheduledPosts, newPost])

    // Reset form
    setPostContent("")
    setSelectedCategory("")
    setSelectedDate(new Date())
    setSelectedTime("12:00")

    // Show success message
    toast({
      title: "Post scheduled",
      description: `Your post has been scheduled for ${format(scheduledDate, "PPP p")}`,
    })

    // Switch to scheduled tab
    setActiveTab("scheduled")
  }

  // Clear completed posts
  const handleClearCompleted = () => {
    const updatedPosts = scheduledPosts.filter((post) => post.status !== "completed")
    setScheduledPosts(updatedPosts)
    setIsClearDialogOpen(false)

    toast({
      title: "Completed posts cleared",
      description: "All completed posts have been removed from the list",
    })
  }

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setCsvContent(content)
      previewCsvContent(content)
    }
    reader.readAsText(file)
  }

  // Download CSV template
  const handleDownloadTemplate = () => {
    const element = document.createElement("a")
    const file = new Blob([csvTemplateContent], { type: "text/csv" })
    element.href = URL.createObjectURL(file)
    element.download = "mass_post_template.csv"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Preview CSV content
  const previewCsvContent = (content: string) => {
    if (!content.trim()) return

    const lines = content.trim().split("\n")
    if (lines.length < 2) {
      setCsvErrors(["CSV file must have at least a header row and one data row"])
      setPreviewPosts([])
      return
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const requiredHeaders = ["content", "category", "date", "time"]

    // Check if all required headers are present
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
    if (missingHeaders.length > 0) {
      setCsvErrors([`Missing required headers: ${missingHeaders.join(", ")}`])
      setPreviewPosts([])
      return
    }

    const errors: string[] = []
    const parsedPosts = []

    // Parse each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]

      // Skip empty lines
      if (!line.trim()) continue

      // Handle quoted content with commas
      let values = []
      let inQuotes = false
      let currentValue = ""

      for (let j = 0; j < line.length; j++) {
        const char = line[j]

        if (char === '"' && (j === 0 || line[j - 1] !== "\\")) {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(currentValue)
          currentValue = ""
        } else {
          currentValue += char
        }
      }

      // Add the last value
      values.push(currentValue)

      // Clean up quotes
      values = values.map((v) => v.trim().replace(/^"|"$/g, ""))

      // Check if we have the right number of values
      if (values.length !== headers.length) {
        errors.push(`Line ${i + 1}: Expected ${headers.length} values, got ${values.length}`)
        continue
      }

      // Create an object from the values
      const post: any = {}
      headers.forEach((header, index) => {
        post[header] = values[index]
      })

      // Validate category
      if (!categories.includes(post.category)) {
        errors.push(`Line ${i + 1}: Invalid category "${post.category}". Must be one of: ${categories.join(", ")}`)
        continue
      }

      // Validate and parse date
      try {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/
        if (!datePattern.test(post.date)) {
          errors.push(`Line ${i + 1}: Invalid date format. Use YYYY-MM-DD`)
          continue
        }

        const timePattern = /^\d{2}:\d{2}$/
        if (!timePattern.test(post.time)) {
          errors.push(`Line ${i + 1}: Invalid time format. Use HH:MM (24-hour format)`)
          continue
        }

        const parsedDate = parse(`${post.date} ${post.time}`, "yyyy-MM-dd HH:mm", new Date())
        if (isNaN(parsedDate.getTime())) {
          errors.push(`Line ${i + 1}: Invalid date or time`)
          continue
        }

        post.scheduledFor = parsedDate
      } catch (error) {
        errors.push(`Line ${i + 1}: Error parsing date/time: ${error}`)
        continue
      }

      parsedPosts.push(post)
    }

    setCsvErrors(errors)
    setPreviewPosts(parsedPosts)
    setIsPreviewDialogOpen(true)
  }

  // Import posts from CSV
  const handleImportPosts = () => {
    if (previewPosts.length === 0) {
      toast({
        title: "Error",
        description: "No valid posts to import",
        variant: "destructive",
      })
      return
    }

    const newPosts = previewPosts.map((post, index) => ({
      id: Date.now() + index,
      content: post.content,
      category: post.category,
      scheduledFor: post.scheduledFor,
      status: "pending",
    }))

    setScheduledPosts([...scheduledPosts, ...newPosts])
    setCsvContent("")
    setPreviewPosts([])
    setIsPreviewDialogOpen(false)

    toast({
      title: "Posts imported",
      description: `${newPosts.length} posts have been scheduled`,
    })

    // Switch to scheduled tab
    setActiveTab("scheduled")
  }

  // Check if a post is in the past
  const isPostInPast = (date: Date) => {
    return date < new Date()
  }

  // Format date for display
  const formatScheduledDate = (date: Date) => {
    return format(date, "PPP p") // Format: "Apr 29, 2023, 9:30 AM"
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
              <Card>
                <CardHeader>
                  <CardTitle>Create New Post</CardTitle>
                  <CardDescription>
                    Schedule a new post for your accounts. Select a category, write your content, and set a date and
                    time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Post Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter your post content here..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Schedule Date</Label>
                      <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date)
                              setIsDateOpen(false)
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Schedule Time</Label>
                      <Popover open={isTimeOpen} onOpenChange={setIsTimeOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                            <Clock className="mr-2 h-4 w-4" />
                            {selectedTime}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <div className="h-60 overflow-y-auto p-1">
                            <div className="grid grid-cols-4 gap-1">
                              {timeOptions.map((time) => (
                                <Button
                                  key={time}
                                  variant="outline"
                                  size="sm"
                                  className={`${selectedTime === time ? "bg-primary text-primary-foreground" : ""}`}
                                  onClick={() => {
                                    setSelectedTime(time)
                                    setIsTimeOpen(false)
                                  }}
                                >
                                  {time}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button size="sm" onClick={handleCreatePost}>
                    Schedule Post
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="mass">
              <Card>
                <CardHeader>
                  <CardTitle>Mass Post</CardTitle>
                  <CardDescription>
                    Schedule multiple posts at once by uploading a CSV file with post content, category, date, and time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4">
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
                        <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload CSV
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-md border p-4 bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4" />
                        <h3 className="text-sm font-medium">CSV Format</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Your CSV file should have the following columns:
                      </p>
                      <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                        <li>
                          <span className="font-medium">content</span> - The text content of your post
                        </li>
                        <li>
                          <span className="font-medium">category</span> - One of: {categories.join(", ")}
                        </li>
                        <li>
                          <span className="font-medium">date</span> - In YYYY-MM-DD format (e.g., 2023-12-25)
                        </li>
                        <li>
                          <span className="font-medium">time</span> - In 24-hour format (e.g., 14:30)
                        </li>
                      </ul>
                    </div>

                    {csvContent && (
                      <div className="space-y-2">
                        <Label htmlFor="csv-preview">CSV Content Preview</Label>
                        <Textarea
                          id="csv-preview"
                          value={csvContent}
                          readOnly
                          className="min-h-[120px] font-mono text-xs"
                        />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => previewCsvContent(csvContent)}>
                            Preview Posts
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduled">
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
                    disabled={!scheduledPosts.some((post) => post.status === "completed")}
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
                        <TableHead>Category</TableHead>
                        <TableHead>Scheduled For</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledPosts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            No scheduled posts found. Create a new post to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        scheduledPosts.map((post) => {
                          // Auto-update status for posts in the past
                          const isPast = isPostInPast(post.scheduledFor)
                          const status = isPast ? "completed" : post.status

                          return (
                            <TableRow key={post.id}>
                              <TableCell className="font-medium max-w-[300px] truncate">{post.content}</TableCell>
                              <TableCell>{post.category}</TableCell>
                              <TableCell>{formatScheduledDate(post.scheduledFor)}</TableCell>
                              <TableCell>
                                <Badge variant={status === "completed" ? "success" : "secondary"}>
                                  {status === "completed" ? "Completed" : "Pending"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>

      {/* Clear Completed Confirmation Dialog */}
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

      {/* Preview Posts Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Posts</DialogTitle>
            <DialogDescription>Review the posts that will be scheduled from your CSV file.</DialogDescription>
          </DialogHeader>

          {csvErrors.length > 0 && (
            <div className="mb-4 p-3 border border-destructive/50 rounded-md bg-destructive/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <h3 className="text-sm font-medium text-destructive">Errors Found</h3>
              </div>
              <ul className="text-xs text-destructive space-y-1 ml-6 list-disc">
                {csvErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {previewPosts.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Scheduled For</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewPosts.map((post, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-[300px] truncate">{post.content}</TableCell>
                        <TableCell>{post.category}</TableCell>
                        <TableCell>{formatScheduledDate(post.scheduledFor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <p className="text-sm">
                  {previewPosts.length} post{previewPosts.length !== 1 ? "s" : ""} ready to be scheduled
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {csvErrors.length > 0 ? (
                <p>Please fix the errors in your CSV file and try again.</p>
              ) : (
                <p>No valid posts found in the CSV file.</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleImportPosts} disabled={previewPosts.length === 0}>
              Schedule {previewPosts.length} Post{previewPosts.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

