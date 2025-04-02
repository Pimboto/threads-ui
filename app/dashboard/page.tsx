//app\dashboard\page.tsx
"use client"

import { useState, useEffect } from "react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"

// Import services
import { accountsService, Account, Category } from "@/lib/services/accounts-service"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

const countVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      delay: 0.2,
    },
  },
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch accounts and categories data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const fetchedAccounts = await accountsService.getAccounts()
      const fetchedCategories = await accountsService.getCategories()
      
      setAccounts(fetchedAccounts)
      setCategories(fetchedCategories)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Compute dashboard statistics
  const computeDashboardStats = () => {
    // Total accounts
    const totalAccounts = accounts.length
    const activeAccounts = accounts.filter(acc => acc.status === 'Active').length

    // Category distribution
    const categoryDistribution = accounts.reduce((acc, account) => {
      const category = account.category || 'Uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: totalAccounts,
      active: activeAccounts,
      categories: categoryDistribution
    }
  }

  // Hardcoded posts data (as requested)
  const postsData = {
    total: 5,
    pending: 3,
    completed: 2,
    nextScheduled: new Date(Date.now() + 3600000), // 1 hour from now
  }

  // Format the next scheduled post time
  const formatNextScheduled = () => {
    const now = new Date()
    const diff = postsData.nextScheduled.getTime() - now.getTime()

    // If less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `in ${minutes} minute${minutes !== 1 ? "s" : ""}`
    }

    // If less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `in ${hours} hour${hours !== 1 ? "s" : ""}`
    }

    // Otherwise show days
    const days = Math.floor(diff / 86400000)
    return `in ${days} day${days !== 1 ? "s" : ""}`
  }

  // Fetch data on mount
  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  // Compute stats whenever accounts change
  const accountsData = mounted ? computeDashboardStats() : { total: 0, active: 0, categories: {} }

  if (!mounted) return null

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
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Button size="sm" onClick={fetchDashboardData} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Total Accounts Card */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <motion.div className="text-2xl font-bold" variants={countVariants}>
                    {accountsData.total}
                  </motion.div>
                  <p className="text-xs text-muted-foreground">{accountsData.active} active accounts</p>
                </CardContent>
                <div className="bg-primary/10 px-4 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Across {Object.keys(accountsData.categories).length} categories</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Scheduled Posts Card (unchanged) */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <motion.div className="text-2xl font-bold" variants={countVariants}>
                    {postsData.total}
                  </motion.div>
                  <p className="text-xs text-muted-foreground">
                    {postsData.pending} pending, {postsData.completed} completed
                  </p>
                </CardContent>
                <div className="bg-primary/10 px-4 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Next post {formatNextScheduled()}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Activity Timeline (unchanged) */}
            <motion.div variants={itemVariants} className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your account activity in the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <motion.div
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="mt-1 rounded-full bg-primary/20 p-1">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Post completed</p>
                        <p className="text-xs text-muted-foreground">
                          "Happy Monday everyone!" post was published to 2 Personal accounts
                        </p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="mt-1 rounded-full bg-primary/20 p-1">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">New post scheduled</p>
                        <p className="text-xs text-muted-foreground">
                          "Check out our new product launch!" scheduled for Marketing accounts
                        </p>
                        <p className="text-xs text-muted-foreground">4 hours ago</p>
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="mt-1 rounded-full bg-primary/20 p-1">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Accounts updated</p>
                        <p className="text-xs text-muted-foreground">3 accounts were moved to the Research category</p>
                        <p className="text-xs text-muted-foreground">6 hours ago</p>
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Category Distribution */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle>Account Distribution</CardTitle>
                <CardDescription>Accounts by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(accountsData.categories).map(([category, count], index) => (
                    <motion.div
                      key={category}
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span>{category}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <motion.div
                          className="h-2 rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / accountsData.total) * 100}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
