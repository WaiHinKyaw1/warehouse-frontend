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
import { Textarea } from "@/components/ui/textarea";
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
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ngoAPI } from "@/lib/api";

interface NGO {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  created_at?: string;
  updated_at?: string;
}

export function NGOsManagement() {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNGO, setEditingNGO] = useState<NGO | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });
  const { toast } = useToast();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ngoToDelete, setNgoToDelete] = useState<NGO | null>(null);

  // Fetch NGOs from API
  const fetchNGOs = async () => {
    try {
      setLoading(true);
      const response = await ngoAPI.getAll();
      setNgos(response.data || response);
    } catch (error) {
      console.error("Failed to fetch NGOs:", error);
      toast({
        title: "Error",
        description: "Failed to load NGOs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNGOs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingNGO) {
        await ngoAPI.update(editingNGO.id, formData);
        toast({
          title: "Success",
          description: "NGO updated successfully.",
          variant: "success",
        });
      } else {
        await ngoAPI.create(formData);
        toast({
          title: "Success",
          description: "NGO created successfully.",
          variant: "success",
        });
      }

      // Refresh data after successful operation
      await fetchNGOs();

      setIsDialogOpen(false);
      setEditingNGO(null);
      setFormData({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
      });
    } catch (error: any) {
      console.error("Failed to save NGO:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save NGO. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ngo: NGO) => {
    setEditingNGO(ngo);
    setFormData({
      name: ngo.name,
      contact_person: ngo.contact_person,
      phone: ngo.phone,
      email: ngo.email,
      address: ngo.address,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!ngoToDelete) return;

    try {
      await ngoAPI.delete(ngoToDelete.id);

      // Refresh data after successful deletion
      await fetchNGOs();

      toast({
        title: "Success",
        description: "NGO deleted successfully.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Failed to delete NGO:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete NGO. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setNgoToDelete(null);
    }
  };

  const openDeleteDialog = (ngo: NGO) => {
    setNgoToDelete(ngo);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading NGOs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">NGOs Management</h2>
          <p className="text-muted-foreground">
            Manage NGO partners and their information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingNGO(null);
                setFormData({
                  name: "",
                  contact_person: "",
                  phone: "",
                  email: "",
                  address: "",
                });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add NGO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingNGO ? "Edit NGO" : "Add New NGO"}
              </DialogTitle>
              <DialogDescription>
                {editingNGO
                  ? "Update the NGO details below."
                  : "Enter the details for the new NGO partner."}
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
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact_person" className="text-right">
                    Contact Person
                  </Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_person: e.target.value,
                      })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="col-span-3"
                    rows={3}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingNGO ? "Update" : "Create"} NGO
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
                Are you sure you want to delete this NGO? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            {ngoToDelete && (
              <div className="py-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>{" "}
                    {ngoToDelete.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Contact Person:</span>{" "}
                    {ngoToDelete.contact_person}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>{" "}
                    {ngoToDelete.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>{" "}
                    {ngoToDelete.email}
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
                Delete NGO
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {ngos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              No NGOs found. Add your first NGO partner to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ngos.map((ngo) => (
            <Card key={ngo.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  {ngo.name}
                </CardTitle>
                <CardDescription>Contact: {ngo.contact_person}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {ngo.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {ngo.email}
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="flex-1">{ngo.address}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(ngo)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(ngo)}
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
  );
}
