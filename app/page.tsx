"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Truck, Users, Building2, FileText, BarChart3, Warehouse, User, Car } from "lucide-react"
import { ItemsManagement } from "./components/items-management"
import { WarehouseItemsManagement } from "./components/warehouse-items-management"
import { WarehousesManagement } from "./components/warehouses-management"
import { NGOsManagement } from "./components/ngos-management"
import { SupplyRequestsManagement } from "./components/supply-requests-management"
import { DeliveriesManagement } from "./components/deliveries-management"
import { UsersManagement } from "./components/users-management"
import { DriversManagement } from "./components/drivers-management"
import { TrucksManagement } from "./components/trucks-management"
import { Dashboard } from "./components/dashboard"

import { NGODashboard } from "./components/ngo-dashboard"
import { authAPI, setAuthToken } from "@/lib/api"
import { Login } from "./components/login"

export default function NGOWarehouseDashboard() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Check for existing session on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem("ngo_user")
    const savedToken = localStorage.getItem("auth_token")

    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setAuthToken(savedToken)
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem("ngo_user")
        localStorage.removeItem("auth_token")
      }
    }
  }, [])

  const handleLogin = (userData: any) => {
    setUser(userData)
    localStorage.setItem("ngo_user", JSON.stringify(userData))
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      setActiveTab("dashboard")
    }
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Show NGO dashboard for NGO users */}
      {user.role === "ngo" ? (
        <NGODashboard user={user} onLogout={handleLogout} />
      ) : (
        // Show admin dashboard for admin users
        <>
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-3">
                  <Package className="h-8 w-8 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900">NGO Supply Network</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-10">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Items
                </TabsTrigger>
                <TabsTrigger value="inventory" className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  Inventory
                </TabsTrigger>
                <TabsTrigger value="warehouses" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Warehouses
                </TabsTrigger>
                <TabsTrigger value="ngos" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  NGOs
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Requests
                </TabsTrigger>
                <TabsTrigger value="deliveries" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Deliveries
                </TabsTrigger>
                <TabsTrigger value="drivers" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Drivers
                </TabsTrigger>
                <TabsTrigger value="trucks" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Trucks
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <Dashboard />
              </TabsContent>

              <TabsContent value="items">
                <ItemsManagement />
              </TabsContent>

              <TabsContent value="inventory">
                <WarehouseItemsManagement />
              </TabsContent>

              <TabsContent value="warehouses">
                <WarehousesManagement />
              </TabsContent>

              <TabsContent value="ngos">
                <NGOsManagement />
              </TabsContent>

              <TabsContent value="requests">
                <SupplyRequestsManagement />
              </TabsContent>

              <TabsContent value="deliveries">
                <DeliveriesManagement />
              </TabsContent>

              <TabsContent value="drivers">
                <DriversManagement />
              </TabsContent>

              <TabsContent value="trucks">
                <TrucksManagement />
              </TabsContent>

              <TabsContent value="users">
                <UsersManagement />
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}
