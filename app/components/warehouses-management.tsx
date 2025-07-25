"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Building2, MapPin, Loader2 } from "lucide-react"
import { warehouseAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Warehouse {
  id: number
  name: string
  address: string
  capacity: number
  created_at?: string
  updated_at?: string
}

export function WarehousesManagement() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    capacity: 0,
  })
  const { toast } = useToast()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null)

  // Fetch warehouses from API
  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      const response = await warehouseAPI.getAll()
      setWarehouses(response.data || response)
    } catch (error) {
      console.error("Failed to fetch warehouses:", error)
      toast({
        title: "Error",
        description: "Failed to load warehouses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingWarehouse) {
        await warehouseAPI.update(editingWarehouse.id, formData)
        toast({
          title: "Success",
          description: "Warehouse updated successfully.",
        })
      } else {
        await warehouseAPI.create(formData)
        toast({
          title: "Success",
          description: "Warehouse created successfully.",
        })
      }

      // Refresh data after successful operation
      await fetchWarehouses()

      setIsDialogOpen(false)
      setEditingWarehouse(null)
      setFormData({ name: "", address: "", capacity: 0 })
    } catch (error: any) {
      console.error("Failed to save warehouse:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save warehouse. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormData({
      name: warehouse.name,
      address: warehouse.address,
      capacity: warehouse.capacity,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!warehouseToDelete) return

    try {
      await warehouseAPI.delete(warehouseToDelete.id)

      // Refresh data after successful deletion
      await fetchWarehouses()

      toast({
        title: "Success",
        description: "Warehouse deleted successfully.",
      })
    } catch (error: any) {
      console.error("Failed to delete warehouse:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete warehouse. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setWarehouseToDelete(null)
    }
  }

  const openDeleteDialog = (warehouse: Warehouse) => {
    setWarehouseToDelete(warehouse)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading warehouses...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Warehouses Management</h2>
          <p className="text-muted-foreground">Manage warehouse locations and capacity</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingWarehouse(null)
                setFormData({ name: "", address: "", capacity: 0 })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
              <DialogDescription>
                {editingWarehouse ? "Update the warehouse details below." : "Enter the details for the new warehouse."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="capacity" className="text-right">
                    Capacity
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number.parseInt(e.target.value) || 0 })}
                    className="col-span-3"
                    required
                    min="1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingWarehouse ? "Update" : "Create"} Warehouse
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
                Are you sure you want to delete this warehouse? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {warehouseToDelete && (
              <div className="py-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span> {warehouseToDelete.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Address:</span> {warehouseToDelete.address}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Capacity:</span>
                    <span className="text-red-600 font-bold">{warehouseToDelete.capacity}</span>
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
                Delete Warehouse
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {warehouses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No warehouses found. Add your first warehouse to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  {warehouse.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {warehouse.address}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Storage Capacity</span>
                  <span className="text-sm font-medium text-blue-600">{warehouse.capacity} units</span>
                </div>

                {warehouse.created_at && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(warehouse.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(warehouse)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(warehouse)}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
