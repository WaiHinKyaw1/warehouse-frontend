"use client";

import { DialogTrigger } from "@/components/ui/dialog";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Building2,
  Loader2,
  FileText,
  Users,
} from "lucide-react";
import {
  warehouseItemAPI,
  itemAPI,
  warehouseAPI,
  ngoAPI,
  supplyRequestAPI,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface WarehouseItem {
  id: number;
  ngo_id?: number;
  ware_house_id: number;
  item_id: number;
  quantity: number;
  created_at?: string;
  updated_at?: string;
  warehouse?: { name: string };
  ngo?: { name: string };
  item?: { name: string; unit: string };
}

interface Item {
  id: number;
  name: string;
  unit: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface NGO {
  id: number;
  name: string;
}

export function WarehouseItemsManagement() {
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouseItem, setEditingWarehouseItem] =
    useState<WarehouseItem | null>(null);
  const [formData, setFormData] = useState({
    ngo_id: "",
    ware_house_id: "",
    item_id: "",
    quantity: 0,
  });
  const { toast } = useToast();

  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedNGO, setSelectedNGO] = useState("");
  const [selectedWarehouseForRequest, setSelectedWarehouseForRequest] =
    useState("");
  const [selectedItemsForRequest, setSelectedItemsForRequest] = useState<
    Array<{ item_id: number; quantity: number; max_quantity: number }>
  >([]);
  const [ngos, setNgos] = useState<NGO[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WarehouseItem | null>(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        warehouseItemsResponse,
        itemsResponse,
        warehousesResponse,
        ngosResponse,
      ] = await Promise.all([
        warehouseItemAPI.getAll().catch(() => ({ data: [] })),
        itemAPI.getAll().catch(() => ({ data: [] })),
        warehouseAPI.getAll().catch(() => ({ data: [] })),
        ngoAPI.getAll().catch(() => ({ data: [] })),
      ]);

      setWarehouseItems(
        warehouseItemsResponse.data || warehouseItemsResponse || []
      );
      setItems(itemsResponse.data || itemsResponse || []);
      setWarehouses(warehousesResponse.data || warehousesResponse || []);
      setNgos(ngosResponse.data || ngosResponse || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = {
        ngo_id: Number.parseInt(formData.ngo_id),
        ware_house_id: Number.parseInt(formData.ware_house_id),
        item_id: Number.parseInt(formData.item_id),
        quantity: formData.quantity,
      };

      if (editingWarehouseItem) {
        await warehouseItemAPI.update(editingWarehouseItem.id, submitData);
        toast({
          title: "Success",
          description: "Warehouse item updated successfully.",
        });
      } else {
        await warehouseItemAPI.create(submitData);
        toast({
          title: "Success",
          description: "Warehouse item created successfully.",
        });
      }

      // Refresh the data after successful create/update
      await fetchData();

      setIsDialogOpen(false);
      setEditingWarehouseItem(null);
      setFormData({ ngo_id: "", ware_house_id: "", item_id: "", quantity: 0 });
    } catch (error: any) {
      console.error("Failed to save warehouse item:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to save warehouse item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (warehouseItem: WarehouseItem) => {
    setEditingWarehouseItem(warehouseItem);
    setFormData({
      ngo_id: warehouseItem.ngo_id?.toString() || "",
      ware_house_id: warehouseItem.ware_house_id.toString(),
      item_id: warehouseItem.item_id.toString(),
      quantity: warehouseItem.quantity,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await warehouseItemAPI.delete(itemToDelete.id);

      // Refresh the data after successful deletion
      await fetchData();

      toast({
        title: "Success",
        description: "Warehouse item deleted successfully.",
      });
    } catch (error: any) {
      console.error("Failed to delete warehouse item:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to delete warehouse item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const openDeleteDialog = (warehouseItem: WarehouseItem) => {
    setItemToDelete(warehouseItem);
    setDeleteDialogOpen(true);
  };
  console.log("###", warehouseItems);

  const getQuantityColor = (quantity: number) => {
    if (quantity === 0) return "bg-red-100 text-red-800";
    if (quantity < 50) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const handleWarehouseSelectionForRequest = (warehouseId: string) => {
    setSelectedWarehouseForRequest(warehouseId);
    setSelectedItemsForRequest([]); // Reset items when warehouse changes
  };

  const getAvailableItemsForWarehouse = () => {
    if (!selectedWarehouseForRequest) return [];
    return warehouseItems.filter(
      (wi) =>
        wi.ware_house_id === Number.parseInt(selectedWarehouseForRequest) &&
        wi.quantity > 0
    );
  };

  const handleItemSelectionForRequest = (
    warehouseItem: WarehouseItem,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedItemsForRequest([
        ...selectedItemsForRequest,
        {
          item_id: warehouseItem.item_id,
          quantity: 1,
          max_quantity: warehouseItem.quantity,
        },
      ]);
    } else {
      setSelectedItemsForRequest(
        selectedItemsForRequest.filter(
          (item) => item.item_id !== warehouseItem.item_id
        )
      );
    }
  };

  const updateRequestItemQuantity = (itemId: number, quantity: number) => {
    setSelectedItemsForRequest(
      selectedItemsForRequest.map((item) =>
        item.item_id === itemId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(quantity, item.max_quantity)),
            }
          : item
      )
    );
  };

  const handleCreateSupplyRequest = async () => {
    if (
      !selectedNGO ||
      !selectedWarehouseForRequest ||
      selectedItemsForRequest.length === 0
    ) {
      toast({
        title: "Error",
        description: "Please select NGO, warehouse, and at least one item.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const requestData = {
        ware_house_id: Number.parseInt(selectedWarehouseForRequest),
        ngo_id: Number.parseInt(selectedNGO),
        items: selectedItemsForRequest.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity,
        })),
      };

      await supplyRequestAPI.create(requestData);

      toast({
        title: "Success",
        description: "Supply request created successfully.",
      });

      // Reset form
      setIsRequestDialogOpen(false);
      setSelectedNGO("");
      setSelectedWarehouseForRequest("");
      setSelectedItemsForRequest([]);
    } catch (error: any) {
      console.error("Failed to create supply request:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to create supply request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading warehouse inventory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Warehouse Inventory
          </h2>
          <p className="text-muted-foreground">
            Manage item quantities in each warehouse
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingWarehouseItem(null);
                  setFormData({
                    ngo_id: "",
                    ware_house_id: "",
                    item_id: "",
                    quantity: 0,
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Inventory
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingWarehouseItem
                    ? "Edit Inventory Item"
                    : "Add Item to Warehouse"}
                </DialogTitle>
                <DialogDescription>
                  {editingWarehouseItem
                    ? "Update the inventory details below."
                    : "Add an item to a warehouse with quantity."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="ngo" className="text-right">
                      NGO
                    </Label>
                    <Select
                      value={formData.ngo_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, ngo_id: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select NGO" />
                      </SelectTrigger>
                      <SelectContent>
                        {ngos.map((ngo) => (
                          <SelectItem key={ngo.id} value={ngo.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {ngo.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="warehouse" className="text-right">
                      Warehouse
                    </Label>
                    <Select
                      value={formData.ware_house_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, ware_house_id: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem
                            key={warehouse.id}
                            value={warehouse.id.toString()}
                          >
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item" className="text-right">
                      Item
                    </Label>
                    <Select
                      value={formData.item_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, item_id: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.name} ({item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: Number.parseInt(e.target.value) || 0,
                        })
                      }
                      className="col-span-3"
                      required
                      min="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingWarehouseItem ? "Update" : "Add"} Inventory
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
                  Are you sure you want to delete this inventory item? This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {itemToDelete && (
                <div className="py-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">NGO:</span>{" "}
                      {itemToDelete.ngo?.name || `NGO ${itemToDelete.ngo_id}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Warehouse:</span>{" "}
                      {itemToDelete.warehouse?.name ||
                        `Warehouse ${itemToDelete.ware_house_id}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Item:</span>{" "}
                      {itemToDelete.item?.name ||
                        `Item ${itemToDelete.item_id}`}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Quantity:</span>
                      <span className="text-red-600 font-bold">
                        {itemToDelete.quantity} {itemToDelete.item?.unit}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Warehouse Inventory ({warehouseItems.length})
          </CardTitle>
          <CardDescription>
            Items and their quantities in each warehouse
          </CardDescription>
        </CardHeader>
        <CardContent>
          {warehouseItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                No inventory items found. Add items to warehouses to get
                started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NGO</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouseItems.map((warehouseItem) => (
                  <TableRow key={warehouseItem.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {warehouseItem.ngo?.name ||
                          `NGO ${warehouseItem.ngo_id}`}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {warehouseItem.warehouse?.name ||
                          `Warehouse ${warehouseItem.ware_house_id}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {warehouseItem.item?.name ||
                          `Item ${warehouseItem.item_id}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {warehouseItem.item?.unit || "unit"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQuantityColor(
                          warehouseItem.quantity
                        )}`}
                      >
                        {warehouseItem.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      {warehouseItem.updated_at
                        ? new Date(
                            warehouseItem.updated_at
                          ).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(warehouseItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(warehouseItem)}
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
  );
}
