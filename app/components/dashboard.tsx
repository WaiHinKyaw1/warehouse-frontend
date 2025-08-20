"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Building2, Users, Truck, TrendingUp, AlertTriangle, Loader2 } from "lucide-react"
import { itemAPI, warehouseAPI, ngoAPI, supplyRequestAPI } from "@/lib/api"
import { dashboardAPI } from "@/lib/api";
interface DashboardStats {
  totalItems: number
  totalWarehouses: number
  totalNGOs: number
  activeRequests: number
}
interface LowStockItem {
  item_name: string;
  warehouse_name: string;
  quantity: number;
}

export function Dashboard() {
  const [alerts, setAlerts] = useState<{ low_stock_items: LowStockItem[] }>({
    low_stock_items: [],
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalWarehouses: 0,
    totalNGOs: 0,
    activeRequests: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentRequests, setRecentRequests] = useState<any[]>([])

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [itemsResponse, warehousesResponse, ngosResponse, requestsResponse] = await Promise.all([
        itemAPI.getAll().catch(() => ({ data: [] })),
        warehouseAPI.getAll().catch(() => ({ data: [] })),
        ngoAPI.getAll().catch(() => ({ data: [] })),
        supplyRequestAPI.getAll().catch(() => ({ data: [] })),
      ])

      const items = itemsResponse.data || itemsResponse || []
      const warehouses = warehousesResponse.data || warehousesResponse || []
      const ngos = ngosResponse.data || ngosResponse || []
      const requests = requestsResponse.data || requestsResponse || []

      setStats({
        totalItems: items.length,
        totalWarehouses: warehouses.length,
        totalNGOs: ngos.length,
        activeRequests: requests.filter((req: any) => req.status !== "delivered").length,
      })

      // Set recent requests (last 3)
      setRecentRequests(requests.slice(-3).reverse())
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])



  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await dashboardAPI.getAlerts();
        setAlerts(res);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    }

    fetchAlerts();
  }, []);

  const statsCards = [
    {
      title: "Total Items",
      value: stats.totalItems.toString(),
      change: "+12%",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Active Warehouses",
      value: stats.totalWarehouses.toString(),
      change: "+2",
      icon: Building2,
      color: "text-green-600",
    },
    {
      title: "Registered NGOs",
      value: stats.totalNGOs.toString(),
      change: "+5",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Active Requests",
      value: stats.activeRequests.toString(),
      change: "+8",
      icon: Truck,
      color: "text-orange-600",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your NGO supply network operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Supply Requests</CardTitle>
            <CardDescription>Latest requests from NGO partners</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No recent requests found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request, index) => (
                  <div key={request.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{request.ngo?.name || `Request #${request.id}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {console.log(request.route_infos.start)}
                        {request.route_infos[0].start} → {request.route_infos[0]?.end}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${request.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : request.status === "in_transit"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {request.status || "pending"}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.created_at ? new Date(request.created_at).toLocaleDateString() : "Today"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Low Stock Alert</p>
                <div className="text-xs text-muted-foreground">
                  {alerts?.low_stock_items?.length ? (
                    alerts.low_stock_items.map((item, index) => (
                      <p key={index} className="text-xs text-red-500 text-muted-foreground">
                        {item.item_name} in {item.warehouse_name}: {item.quantity} QTY
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Monitor inventory levels
                    </p>
                  )}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <span className="text-sm font-medium">System Status</span>
                <p className="text-xs text-muted-foreground">{alerts?.system_status?.database === "ok"
                  ? "All systems operational"
                  : "Issues detected"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
