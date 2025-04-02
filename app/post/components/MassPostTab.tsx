//app\post\components\MassPostTab.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { accountsService, Category } from "@/lib/services/accounts-service";

// CSV template content - now with only content and time columns
const csvTemplateContent = `content,time
"Check out our new product launch!",9:00 AM
"Happy holidays to all our customers!",10:00 AM
"New year sale starting soon!",12:00 PM`;

interface MassPostTabProps {
  onPostsImported?: (
    posts: Array<{
      id: number;
      content: string;
      categoryId: string;
      scheduledTime: string;
      status: string;
    }>
  ) => void;
}

interface PostPreview {
  content: string;
  time: string;
}

export function MassPostTab({ onPostsImported }: MassPostTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvContent, setCsvContent] = useState("");
  const [previewPosts, setPreviewPosts] = useState<PostPreview[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
    accountCount: number;
  } | null>(null);

  // Random Delay
  const [randomDelay, setRandomDelay] = useState(false);
  const [randomDelayMinutes, setRandomDelayMinutes] = useState(1);

  // Load categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories =
          await accountsService.getCategoriesWithAccounts();
        setCategories(
          fetchedCategories.map((category) => ({
            ...category,
            accounts: category.accounts || [],
          }))
        );
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch categories",
          variant: "destructive",
        });
      }
    };

    fetchCategories();
  }, []);

  // Download CSV template
  const handleDownloadTemplate = () => {
    const element = document.createElement("a");
    const file = new Blob([csvTemplateContent], { type: "text/csv" });
    element.href = URL.createObjectURL(file);
    element.download = "mass_post_template.csv";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      previewCsvContent(content);
    };
    reader.readAsText(file);
  };

  // Preview CSV content
  const previewCsvContent = (content: string) => {
    if (!content.trim()) return;

    const lines = content.trim().split("\n");
    if (lines.length < 2) {
      setCsvErrors([
        "CSV file must have at least a header row and one data row",
      ]);
      setPreviewPosts([]);
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredHeaders = ["content", "time"];

    // Check if all required headers are present
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      setCsvErrors([`Missing required headers: ${missingHeaders.join(", ")}`]);
      setPreviewPosts([]);
      return;
    }

    const errors: string[] = [];
    const parsedPosts: PostPreview[] = [];

    // Parse each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines
      if (!line.trim()) continue;

      // Handle quoted content with commas
      let values = [];
      let inQuotes = false;
      let currentValue = "";

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"' && (j === 0 || line[j - 1] !== "\\")) {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(currentValue);
          currentValue = "";
        } else {
          currentValue += char;
        }
      }

      // Add the last value
      values.push(currentValue);

      // Clean up quotes
      values = values.map((v) => v.trim().replace(/^"|"$/g, ""));

      // Check if we have the right number of values
      if (values.length !== headers.length) {
        errors.push(
          `Line ${i + 1}: Expected ${headers.length} values, got ${
            values.length
          }`
        );
        continue;
      }

      // Create an object from the values
      const post: any = {};
      headers.forEach((header, index) => {
        post[header] = values[index];
      });

      // Validate time format (12-hour format with AM/PM)
      const timeRegex = /^(1[0-2]|0?[1-9]):([0-5][0-9])\s?(AM|PM|am|pm)$/;
      if (!timeRegex.test(post.time.trim())) {
        errors.push(
          `Line ${
            i + 1
          }: Invalid time format. Use "HH:MM AM/PM" (e.g., "9:00 AM" or "2:30 PM")`
        );
        continue;
      }

      parsedPosts.push({
        content: post.content,
        time: post.time.trim(),
      });
    }

    setCsvErrors(errors);
    setPreviewPosts(parsedPosts);
  };

  // Schedule posts
  const handleSchedulePosts = async () => {
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    if (previewPosts.length === 0) {
      toast({
        title: "Error",
        description: "No valid posts to schedule",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare payload for bulk post
      const payload = {
        categoryId: selectedCategory.id,
        texts: previewPosts.map((post) => post.content),
        scheduledTimes: previewPosts.map((post) => post.time),
        randomDelayMinutes: randomDelay ? randomDelayMinutes : undefined,
      };

      // Call bulk post service
      const response = await accountsService.createBulkPost(payload);

      // Notify parent if needed and display toast
      if (onPostsImported) {
        const formattedPosts = previewPosts.map((post, index) => ({
          id: Date.now() + index,
          content: post.content,
          categoryId: selectedCategory.id,
          scheduledTime: post.time,
          status: "pending",
        }));

        onPostsImported(formattedPosts);
      }

      toast({
        title: "Posts Scheduled",
        description: `${previewPosts.length} posts have been scheduled for the ${selectedCategory.name} category`,
      });

      // Reset state
      setCsvContent("");
      setPreviewPosts([]);
      setCsvErrors([]);
      setSelectedCategory(null);
      setRandomDelay(false);
      setRandomDelayMinutes(1);
    } catch (error) {
      console.error("Error scheduling posts:", error);
      toast({
        title: "Error",
        description: "Failed to schedule posts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mass Post</CardTitle>
        <CardDescription>
          Schedule multiple posts at once by uploading a CSV file with post
          content and time. Select the account category to post to.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          {/* Category Selector */}
          <div className="space-y-2">
            <Label htmlFor="category">Account Category</Label>
            <Select
              value={selectedCategory?.id ?? ""}
              onValueChange={(id) => {
                const category = categories.find((c) => c.id === id);
                if (category) {
                  setSelectedCategory({
                    id: category.id ?? "",
                    name: category.name,
                    accountCount: category.accounts?.length ?? 0,
                  });
                }
              }}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id ?? ""}>
                    {category.name} ({category.accounts?.length ?? 0} accounts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Random Delay Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="random-delay"
              checked={randomDelay}
              onCheckedChange={setRandomDelay}
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
              />
            )}
          </div>

          <div className="flex justify-between items-center">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>

            <div>
              <input
                type="file"
                accept=".csv,.txt"
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
              <FileText className="w-4" />
              <h3 className="text-sm font-medium">CSV Format</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Your CSV file should have the following columns:
            </p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>
                <span className="font-medium">content</span> - The text content
                of your post
              </li>
              <li>
                <span className="font-medium">time</span> - In 12-hour format
                with AM/PM (e.g., 9:00 AM)
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

          {/* Preview Posts */}
          {previewPosts.length > 0 && (
            <div className="space-y-4">
              {csvErrors.length > 0 && (
                <div className="mb-4 p-3 border border-destructive/50 rounded-md bg-destructive/10">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <h3 className="text-sm font-medium text-destructive">
                      Errors Found
                    </h3>
                  </div>
                  <ul className="text-xs text-destructive space-y-1 ml-6 list-disc">
                    {csvErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewPosts.map((post, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium max-w-[300px] truncate">
                          {post.content}
                        </TableCell>
                        <TableCell>{post.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <p className="text-sm">
                  {previewPosts.length} post
                  {previewPosts.length !== 1 ? "s" : ""} ready to be scheduled
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {previewPosts.length > 0 && (
        <CardFooter className="flex justify-end space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPreviewPosts([]);
              setCsvErrors([]);
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSchedulePosts}
            disabled={
              previewPosts.length === 0 || !selectedCategory || isLoading
            }
          >
            {isLoading
              ? "Scheduling..."
              : `Schedule ${previewPosts.length} Post${
                  previewPosts.length !== 1 ? "s" : ""
                }`}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
