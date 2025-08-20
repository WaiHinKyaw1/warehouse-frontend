"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, User, Hash, Loader2, Building2 } from "lucide-react"
import { truckAPI, driverAPI, warehouseAPI } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

interface Truck {
  id: number
  plate_no: string
  model: string
  capacity: number
  status: "available" | "in_use" | "maintenance"
  driver_id: number
  ware_house_id: number
  driver?: { name: string; phone: string }
  ware_house?: { name: string }
  created_at?: string
  updated_at?: string
}

interface Driver {
  id: number
  name: string
  phone: string
  license_no: string
  status: "active" | "inactive"
}

interface Warehouse {
  id: number
  name: string
}

export function TrucksManagement() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null)
  const [formData, setFormData] = useState({
    plate_no: "",
    model: "",
    capacity: 0,
    status: "available",
    driver_id: "",
    ware_house_id: "",
  })
  const { toast } = useToast()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [truckToDelete, setTruckToDelete] = useState<Truck | null>(null)

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true)
      const [trucksResponse, driversResponse, warehousesResponse] = await Promise.all([
        truckAPI.getAll().catch(() => ({ data: [] })),
        driverAPI.getAll().catch(() => ({ data: [] })),
        warehouseAPI.getAll().catch(() => ({ data: [] })),
      ])

      setTrucks(trucksResponse.data || trucksResponse || [])
      setDrivers(driversResponse.data || driversResponse || [])
      setWarehouses(warehousesResponse.data || warehousesResponse || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const submitData = {
        plate_no: formData.plate_no,
        model: formData.model,
        capacity: formData.capacity,
        status: formData.status,
        driver_id: Number.parseInt(formData.driver_id),
        ware_house_id: Number.parseInt(formData.ware_house_id),
      }

      if (editingTruck) {
        await truckAPI.update(editingTruck.id, submitData)
        toast({
          title: "Success",
          description: "Truck updated successfully.",
          variant: "success",
        })
      } else {
        await truckAPI.create(submitData)
        toast({
          title: "Success",
          description: "Truck created successfully.",
          variant: "success",
        })
      }

      // Refresh data after successful operation
      await fetchData()

      setIsDialogOpen(false)
      setEditingTruck(null)
      setFormData({
        plate_no: "",
        model: "",
        capacity: 0,
        status: "available",
        driver_id: "",
        ware_house_id: "",
      })
    } catch (error: any) {
      console.error("Failed to save truck:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save truck. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck)
    setFormData({
      plate_no: truck.plate_no,
      model: truck.model,
      capacity: truck.capacity,
      status: truck.status,
      driver_id: truck.driver_id.toString(),
      ware_house_id: truck.ware_house_id.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!truckToDelete) return

    try {
      await truckAPI.delete(truckToDelete.id)

      // Refresh data after successful deletion
      await fetchData()

      toast({
        title: "Success",
        description: "Truck deleted successfully.",
        variant: "success",
      })
    } catch (error: any) {
      console.error("Failed to delete truck:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete truck. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setTruckToDelete(null)
    }
  }

  const openDeleteDialog = (truck: Truck) => {
    setTruckToDelete(truck)
    setDeleteDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "in_use":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get available drivers (active status)
  const getAvailableDrivers = () => {
  const assignedDriverIds = trucks
    .filter((t) => editingTruck ? t.id !== editingTruck.id : true)
    .map((t) => t.driver_id);

  return drivers.filter(
    (driver) =>
      driver.status === "active" && !assignedDriverIds.includes(driver.id)
  );  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading trucks...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trucks Management</h2>
          <p className="text-muted-foreground">Manage delivery trucks and assign drivers and warehouses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingTruck(null)
                setFormData({
                  plate_no: "",
                  model: "",
                  capacity: 0,
                  status: "available",
                  driver_id: "",
                  ware_house_id: "",
                })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Truck
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTruck ? "Edit Truck" : "Add New Truck"}</DialogTitle>
              <DialogDescription>
                {editingTruck ? "Update the truck details below." : "Enter the details for the new truck."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="plate_no" className="text-right">
                    Plate No
                  </Label>
                  <Input
                    id="plate_no"
                    value={formData.plate_no}
                    onChange={(e) => setFormData({ ...formData, plate_no: e.target.value })}
                    className="col-span-3"
                    placeholder="YGN-9A1234"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="model" className="text-right">
                    Model
                  </Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="col-span-3"
                    placeholder="Hino 500"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="capacity" className="text-right">
                    Capacity (kg)
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: Number.parseInt(e.target.value) || 0,
                      })
                    }
                    className="col-span-3"
                    placeholder="5000"
                    required
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        status: value as "available" | "in_use" | "maintenance",
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="driver" className="text-right">
                    Driver
                  </Label>
                  <Select
                    value={formData.driver_id}
                    onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDrivers().length === 0 ? (
                          <div className="p-2 text-gray-500 text-sm">No drivers available</div>
                        ) : (
                      getAvailableDrivers().map((driver) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {driver.name} - {driver.phone}
                          </div>
                        </SelectItem>
                      ))
                    )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="warehouse" className="text-right">
                    Warehouse
                  </Label>
                  <Select
                    value={formData.ware_house_id}
                    onValueChange={(value) => setFormData({ ...formData, ware_house_id: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {warehouse.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTruck ? "Update" : "Create"} Truck
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this truck? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {truckToDelete && (
              <div className="py-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Plate No:</span> {truckToDelete.plate_no}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Model:</span> {truckToDelete.model}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Capacity:</span> {truckToDelete.capacity} kg
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Driver:</span> {truckToDelete.driver?.name || "Not assigned"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Warehouse:</span> {truckToDelete.ware_house?.name || "Not assigned"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <span
                      className={`font-bold ${
                        truckToDelete.status === "available"
                          ? "text-green-600"
                          : truckToDelete.status === "in_use"
                            ? "text-blue-600"
                            : "text-red-600"
                      }`}
                    >
                      {truckToDelete.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Truck
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Trucks ({trucks.length})</CardTitle>
          <CardDescription>All registered trucks in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {trucks.length === 0 ? (
            <div className="text-center py-8">
              <span className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No trucks found. Add your first truck to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate No</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trucks.map((truck) => (
                  <TableRow key={truck.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        {truck.plate_no}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">{truck.model}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">{truck.capacity.toLocaleString()} kg</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {truck.driver?.name || "Not assigned"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {truck.ware_house?.name || "Not assigned"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          truck.status,
                        )}`}
                      >
                        {truck.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>{truck.created_at ? new Date(truck.created_at).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(truck)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(truck)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
