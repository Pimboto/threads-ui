// app/post/components/CreatePostTab.tsx
"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { accountsService, Category } from "@/lib/services/accounts-service"

interface CreatePostTabProps {
  onPostScheduled?: (post: {
    categoryId: string;
    content: string;
    scheduledFor?: Date;
    randomDelayMinutes?: number;
  }) => void
}

export function CreatePostTab({ onPostScheduled }: CreatePostTabProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
    accountCount: number;
  } | null>(null)
  const [postContent, setPostContent] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [isImmediate, setIsImmediate] = useState(false)
  const [randomDelay, setRandomDelay] = useState(false)
  const [randomDelayMinutes, setRandomDelayMinutes] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Reset random delay when immediate posting is enabled
  useEffect(() => {
    if (isImmediate) {
      setRandomDelay(false)
      setRandomDelayMinutes(1)
    }
  }, [isImmediate])

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await accountsService.getCategoriesWithAccounts()
        setCategories(fetchedCategories.map(category => ({
          ...category,
          accounts: category.accounts || []
        })))
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          variant: "destructive"
        })
      }
    }

    fetchCategories()
  }, [])

  const handleCreatePost = async () => {
    // Validate inputs
    if (!selectedCategory || !postContent) {
      toast({
        title: "Error",
        description: "Please select a category and enter post content",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      let scheduledTimeStr: string | undefined;

      // Handle scheduling
      if (!isImmediate) {
        const timeMatch = scheduledTime.match(/(\d+):(\d+)\s*(AM|PM)/i)
        if (!timeMatch) {
          throw new Error("Invalid time format")
        }

        const [, hourStr, minuteStr, period] = timeMatch
        let hours = parseInt(hourStr, 10)
        const minutes = parseInt(minuteStr, 10)

        // Convert to 24-hour format
        if (period.toUpperCase() === 'PM' && hours !== 12) {
          hours += 12
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
          hours = 0
        }

        const scheduledDate = new Date()
        scheduledDate.setHours(hours, minutes, 0, 0)
        
        scheduledTimeStr = format(scheduledDate, "hh:mm A")
      }

      // Prepare payload for bulk post
      const payload = {
        categoryId: selectedCategory.id,
        texts: [postContent],
        scheduledTimes: scheduledTimeStr ? [scheduledTimeStr] : [],
        randomDelayMinutes: !isImmediate && randomDelay ? randomDelayMinutes : undefined
      }

      // Call bulk post service
      const response = await accountsService.createBulkPost(payload)

      // Notify parent component or show success toast
      if (onPostScheduled) {
        onPostScheduled({
          categoryId: selectedCategory.id,
          content: postContent,
          scheduledFor: scheduledTimeStr ? new Date(scheduledTimeStr) : undefined,
          randomDelayMinutes: !isImmediate && randomDelay ? randomDelayMinutes : undefined
        })
      }

      toast({
        title: "Post Created",
        description: `Post scheduled for ${selectedCategory.name} category`,
      })

      // Reset form
      setPostContent("")
      setSelectedCategory(null)
      setScheduledTime("")
      setIsImmediate(false)
      setRandomDelay(false)
      setRandomDelayMinutes(1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Post</CardTitle>
        <CardDescription>
          Schedule a new post for your accounts. Select a category, write your content, and set timing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category">Account Category</Label>
          <Select 
            value={selectedCategory?.id ?? ''} 
            onValueChange={(id) => {
              const category = categories.find(c => c.id === id)
              if (category) {
                setSelectedCategory({
                  id: category.id ?? "",
                  name: category.name,
                  accountCount: category.accounts?.length ?? 0
                })
              }
            }}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem 
                  key={category.id} 
                  value={category.id ?? ""}
                >
                  {category.name} ({category.accounts?.length ?? 0} accounts)
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

        <div className="flex items-center space-x-2">
          <Switch 
            id="immediate-post"
            checked={isImmediate}
            onCheckedChange={setIsImmediate}
          />
          <Label htmlFor="immediate-post">
            Post Immediately
          </Label>
        </div>

        {!isImmediate && (
          <div className="space-y-2">
            <Label>Schedule Time</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Enter time (e.g., 09:30 AM)"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="flex-1"
              />
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}

        {!isImmediate && (
          <div className="flex items-center space-x-2">
            <Switch 
              id="random-delay"
              checked={randomDelay}
              onCheckedChange={setRandomDelay}
              disabled={isImmediate}
            />
            <Label htmlFor="random-delay">
              Random Delay {randomDelay ? `(${randomDelayMinutes} min)` : ""}
            </Label>
            {randomDelay && (
              <Input
                type="number"
                min={1}
                max={5}
                value={randomDelayMinutes}
                onChange={(e) => setRandomDelayMinutes(Number(e.target.value))}
                className="w-20 ml-2"
                disabled={isImmediate}
              />
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          size="sm" 
          onClick={handleCreatePost}
          disabled={!selectedCategory || !postContent || isLoading}
        >
          {isLoading ? "Creating..." : (isImmediate ? "Post Now" : "Schedule Post")}
        </Button>
      </CardFooter>
    </Card>
  )
}
