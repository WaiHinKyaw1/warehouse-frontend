"use client";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  DollarSign,
  User,
  MapPin,
  Clock,
  Package,
  Users,
  Loader2,
  Truck,
} from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { deliveryAPI, supplyRequestAPI, truckAPI } from "@/lib/api";

interface SupplyRequestItem {
  id: number;
  supply_request_id: number;
  item_id: number;
  quantity: number;
  item?: { name: string; unit: string };
}

interface RouteInfo {
  id: number;
  start: string;
  end: string;
  distance_km: string;
  distance_miles: string;
  duration_minutes: string;
  charge: number;
}

interface SupplyRequest {
  id: number;
  ngo_id: number;
  //ware_house_id: number;
  request_date: string;
  status: "pending" | "approved" | "in_transit" | "delivered";
  ngo: {
    id: number;
    name: string;
    contact_person: string;
  };
  supply_request_items: SupplyRequestItem[];
  route_infos: RouteInfo[];
  warehouse: {
    id: number;
    name: string;
    address: string;
  };
}

interface TruckData {
  id: number;
  plate_no: string;
  model: string;
  capacity: number;
  status: "available" | "in_use" | "maintenance";
  driver?: { name: string; phone: string };
}

interface Delivery {
  id: number;
  supply_request_id: number;
  delivery_date: string;
  delivery_cost: number;
  truck_id: number;
  status: "scheduled" | "in_transit" | "delivered" | "delayed";
  created_at?: string;
  supply_request?: SupplyRequest;
  truck?: TruckData;
}

export function DeliveriesManagement() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([]);
  const [trucks, setTrucks] = useState<TruckData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    supply_request_id: "",
    delivery_date: "",
    truck_id: "",
  });
  const { toast } = useToast();

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [deliveriesResponse, requestsResponse, trucksResponse] =
        await Promise.all([
          deliveryAPI.getAll().catch(() => ({ data: [] })),
          supplyRequestAPI.getAll().catch(() => ({ data: [] })),
          truckAPI.getAll().catch(() => ({ data: [] })),
        ]);

      setDeliveries(deliveriesResponse.data || deliveriesResponse || []);
      setSupplyRequests(requestsResponse.data || requestsResponse || []);
      setTrucks(trucksResponse.data || trucksResponse || []);
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
      // Get the selected supply request to get the cost from route_infos
      const selectedRequest = supplyRequests.find(
        (req) => req.id === Number.parseInt(formData.supply_request_id)
      );
      const routeCost = selectedRequest?.route_infos?.[0]?.charge || 0;

      const deliveryData = {
        supply_request_id: Number.parseInt(formData.supply_request_id),
        delivery_date: formData.delivery_date,
        delivery_cost: routeCost, // Use cost from route_infos
        truck_id: Number.parseInt(formData.truck_id),
      };

      await deliveryAPI.create(deliveryData);

      toast({
        title: "Success",
        description: "Delivery scheduled successfully.",
        variant: "success",
      });

      // Refresh data after successful operation
      await fetchData();

      setIsDialogOpen(false);
      setFormData({
        supply_request_id: "",
        delivery_date: "",
        truck_id: "",
      });
    } catch (error: any) {
      console.error("Failed to schedule delivery:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to schedule delivery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_transit":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await deliveryAPI.update(id, { status: newStatus });

      // Refresh data after status update
      await fetchData();

      toast({
        title: "Success",
        description: "Delivery status updated successfully.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Failed to update delivery status:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to update delivery status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (duration: string) => {
    const parts = duration.split(":");
    const hours = Number.parseInt(parts[0]);
    const minutes = Number.parseInt(parts[1]);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get only pending supply requests for scheduling
  const getPendingRequests = () => {
    return supplyRequests.filter((req) => req.status === "pending");
  };

  // Get available trucks
  const getAvailableTrucks = () => {
    return trucks.filter((truck) => truck.status === "available");
  };

  // Get selected request details for cost display
  const getSelectedRequestCost = () => {
    if (!formData.supply_request_id) return 0;
    const selectedRequest = supplyRequests.find(
      (req) => req.id === Number.parseInt(formData.supply_request_id)
    );
    return selectedRequest?.route_infos?.[0]?.charge || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading deliveries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Deliveries Management
          </h2>
          <p className="text-muted-foreground">
            Track and manage supply deliveries
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Delivery
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule New Delivery</DialogTitle>
              <DialogDescription>
                Create a new delivery schedule for a pending supply request.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supply_request" className="text-right">
                    Supply Request
                  </Label>
                  <Select
                    value={formData.supply_request_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, supply_request_id: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select pending request" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPendingRequests().map((request) => (
                        <SelectItem
                          key={request.id}
                          value={request.id.toString()}
                        >
                          #{request.id} - {request.ngo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.supply_request_id && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Cost</Label>
                    <div className="col-span-3 flex items-center gap-2 text-sm text-muted-foreground">
                      {getSelectedRequestCost().toLocaleString()} (MMK)
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="truck" className="text-right">
                    Truck
                  </Label>
                  <Select
                    value={formData.truck_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, truck_id: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select available truck" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTrucks().map((truck) => (
                        <SelectItem key={truck.id} value={truck.id.toString()}>
                          {truck.plate_no} - {truck.model} (
                          {truck.driver?.name || "No driver"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    !formData.supply_request_id ||
                    !formData.truck_id
                  }
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Schedule Delivery
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Deliveries ({deliveries.length})
          </CardTitle>
          <CardDescription>
            Monitor all scheduled and ongoing deliveries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                No deliveries found. Schedule your first delivery to get
                started.
              </p>
            </div>
          ) : (
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>NGO</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery, index) => {
                  const request = delivery.supply_request;
                  const route = request?.route_infos?.[0];
                  return (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        {request ? (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {request.ngo.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {request.ngo.contact_person}
                              </div>
                            </div>
                          </div>
                        ) : (
                          "Unknown NGO"
                        )}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        {route ? (
                          <div className="flex items-center gap-1 text-sm">
                            {route.start} → {route.end}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {route ? `${route.distance_miles} miles` : "-"}
                      </TableCell>
                      <TableCell className="min-w-[100px]">
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
                        <div className="flex items-center gap-1">
                          {route
                            ? route.charge.toLocaleString()
                            : delivery.delivery_cost.toLocaleString()}
                          MMK
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <div className="flex items-center gap-1">
                          <div className="text-sm">
                            Total:{" "}
                            {request?.supply_request_items.reduce(
                              (sum, item) => sum + item.quantity,
                              0
                            )}{" "}
                            <div className="text-xs text-muted-foreground">
                              {request?.supply_request_items
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
                      <TableCell className="min-w-[100px]">
                        {delivery.truck
                          ? `${delivery.truck.plate_no} - ${delivery.truck.model}`
                          : "Not assigned"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {delivery.truck?.driver?.name || "Not assigned"}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            delivery.status
                          )}`}
                        >
                          {delivery.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={delivery.status}
                          onValueChange={(value) =>
                            updateStatus(delivery.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_transit">
                              In Transit
                            </SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
