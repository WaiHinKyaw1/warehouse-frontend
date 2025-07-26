"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, MapPin, Clock, DollarSign, Loader2, Package, Users } from "lucide-react"
import { supplyRequestAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface SupplyRequestItem {
  id: number
  supply_request_id: number
  item_id: number
  quantity: number
  item?: { name: string; unit: string }
}

interface RouteInfo {
  id: number
  start: string
  end: string
  distance_km: string
  distance_miles: string
  duration_minutes: string
  charge: number
  polyline?: string
  supply_request_id: number
}

interface SupplyRequest {
  id: number
  ngo_id: number
  ware_house_id: number
  request_date: string
  status: "pending" | "approved" | "in_transit" | "delivered"
  created_at: string
  updated_at: string
  ngo: {
    id: number
    name: string
    contact_person: string
    phone: string
    email: string
    address: string
  }
  supply_request_items: SupplyRequestItem[]
  route_infos: RouteInfo[]
  warehouse: {
    id: number
    name: string
    address: string
    capacity: number
  }
}

export function SupplyRequestsManagement() {
  const [requests, setRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch supply requests from API
  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await supplyRequestAPI.getAll()
      setRequests(response.data || response || [])
    } catch (error) {
      console.error("Failed to fetch supply requests:", error)
      toast({
        title: "Error",
        description: "Failed to load supply requests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-blue-100 text-blue-800"
      case "in_transit":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (duration: string) => {
    // Convert "00:07:20" format to readable format
    const parts = duration.split(":")
    const hours = Number.parseInt(parts[0])
    const minutes = Number.parseInt(parts[1])

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading supply requests...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Supply Requests</h2>
          <p className="text-muted-foreground">View all supply requests and their details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supply Requests ({ requests.filter((request) => request.status === "pending").length})
          </CardTitle>
          <CardDescription>All supply requests from NGO partners</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 || requests.every((request) => request.status === "approved")
? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No supply requests found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>NGO</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests
  .filter((request) => request.status === "pending").map((request) => {
                  const route = request.route_infos[0] // Get first route info
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">#{request.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{request.ngo.name}</div>
                            <div className="text-xs text-muted-foreground">{request.ngo.contact_person}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {route ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {route.start} → {route.end}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No route</span>
                        )}
                      </TableCell>
                      <TableCell>{route ? `${route.distance_miles} miles` : "-"}</TableCell>
                      <TableCell>
                        {route ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(route.duration_minutes)}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {route ? (
                          <div className="flex items-center gap-1">
                            {route.charge.toLocaleString()} MMK
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="text-sm">
                            Total:{" "}
                            {request.supply_request_items.reduce(
                              (sum, item) => sum + item.quantity,
                              0
                            )}{" "}
                            <div className="text-xs text-muted-foreground">
                              {request.supply_request_items
                                .map(
                                  (item) =>
                                    `${
                                      item.item?.name ?? `Item ${item.item_id}`
                                    } (${item.quantity})`
                                )
                                .join(", ")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                        >
                          {request.status.replace("_", " ")}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
