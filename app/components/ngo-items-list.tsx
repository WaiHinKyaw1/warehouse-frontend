"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Building2, Loader2 } from "lucide-react";
import { warehouseItemAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface WarehouseItem {
  id: number;
  ngo_id?: number;
  warehouse_id: number;
  item_id: number;
  quantity: number;
  ware_house?: { name: string };
  item?: { name: string; unit: string };
}

interface NGOItemsListProps {
  user: any;
}

export function NGOItemsList({ user }: NGOItemsListProps) {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await warehouseItemAPI.getAll();
      const allItems = response.data || response || [];

      // Filter items for the current NGO
      const ngoItems = allItems.filter(
        (item: WarehouseItem) =>
          item.ngo_id === user.ngo_id && item.quantity > 0
      );

      setItems(ngoItems);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast({
        title: "Error",
        description: "Failed to load available items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user.ngo_id]);

  const getQuantityColor = (quantity: number) => {
    if (quantity === 0) return "bg-red-100 text-red-800";
    if (quantity < 50) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading available items...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Available Items ({items.length})
          </CardTitle>
          <CardDescription>
            Items you can request from warehouses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                No items available for your NGO at the moment.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Unit</TableHead> 
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {item.ware_house?.name ||
                          `Warehouse ${item.warehouse_id}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {item.item?.name || `Item ${item.item_id}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.item?.unit || "unit"}
                      </span>
                    </TableCell> 
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQuantityColor(
                          item.quantity
                        )}`}
                      >
                        {item.quantity}
                      </span>
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
