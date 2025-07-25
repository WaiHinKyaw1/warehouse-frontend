"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Package, FileText, User, LogOut } from "lucide-react"
import { NGOItemsList } from "./ngo-items-list"
import { NGORequestsManagement } from "./ngo-requests-management"
import { NGOProfile } from "./ngo-profile"


interface NGODashboardProps {
  user: any
  onLogout: () => void
}

export function NGODashboard({ user, onLogout }: NGODashboardProps) {
  const [activeTab, setActiveTab] = useState("items")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NGO Supply Network</h1>
                <p className="text-sm text-gray-500">{user.ngo?.name || "NGO Dashboard"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Button variant="outline" onClick={onLogout} className="flex items-center gap-2 bg-transparent">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Available Items
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Requests
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <NGOItemsList user={user} />
          </TabsContent>

          <TabsContent value="requests">
            <NGORequestsManagement user={user} />
          </TabsContent>

          <TabsContent value="profile">
            <NGOProfile user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
