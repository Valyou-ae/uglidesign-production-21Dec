import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Search, MoreHorizontal, Plus, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  contactId: string | null;
  notes?: string;
  contactName?: string;
}

interface Contact {
  id: string;
  name: string;
}

const dealFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  contactId: z.string().optional(),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  stage: z.enum(["lead", "proposal", "negotiation", "closed_won", "closed_lost"]),
  probability: z.coerce.number().min(0).max(100, "Probability must be between 0 and 100"),
  notes: z.string().optional(),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

export default function AdminDeals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: "",
      contactId: "",
      value: 0,
      stage: "lead",
      probability: 0,
      notes: "",
    },
  });

  const { data: deals, isLoading: dealsLoading, error: dealsError } = useQuery<Deal[]>({
    queryKey: ["/api/admin/crm/deals"],
    queryFn: async () => {
      const response = await fetch("/api/admin/crm/deals", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch deals");
      const data = await response.json();
      return data.deals || [];
    },
  });

  const { data: contacts } = useQuery<Contact[]>({
    queryKey: ["/api/admin/crm/contacts"],
    queryFn: async () => {
      const response = await fetch("/api/admin/crm/contacts", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch contacts");
      const data = await response.json();
      return data.contacts || [];
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: DealFormValues) => {
      const response = await fetch("/api/admin/crm/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          contactId: data.contactId || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create deal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
      toast({ title: "Success", description: "Deal created successfully" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DealFormValues }) => {
      const response = await fetch(`/api/admin/crm/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          contactId: data.contactId || null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update deal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
      toast({ title: "Success", description: "Deal updated successfully" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/crm/deals/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete deal");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/crm/deals"] });
      toast({ title: "Success", description: "Deal deleted successfully" });
      setDeletingDeal(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const contactMap = new Map(contacts?.map(c => [c.id, c.name]) || []);

  const dealsWithContacts = deals?.map(deal => ({
    ...deal,
    contactName: deal.contactId ? contactMap.get(deal.contactId) || "Unknown" : "No Contact"
  }));

  const filteredDeals = dealsWithContacts?.filter(deal =>
    deal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "lead": return "outline";
      case "proposal": return "secondary";
      case "negotiation": return "default";
      case "closed_won": return "default";
      case "closed_lost": return "destructive";
      default: return "outline";
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingDeal(null);
    form.reset({
      title: "",
      contactId: "",
      value: 0,
      stage: "lead",
      probability: 0,
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (deal: Deal) => {
    setEditingDeal(deal);
    form.reset({
      title: deal.title,
      contactId: deal.contactId || "",
      value: deal.value || 0,
      stage: deal.stage as DealFormValues["stage"],
      probability: deal.probability || 0,
      notes: deal.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingDeal(null);
    form.reset();
  };

  const handleSubmit = (data: DealFormValues) => {
    if (editingDeal) {
      updateDealMutation.mutate({ id: editingDeal.id, data });
    } else {
      createDealMutation.mutate(data);
    }
  };

  const handleDeleteDeal = () => {
    if (deletingDeal) {
      deleteDealMutation.mutate(deletingDeal.id);
    }
  };

  const isSubmitting = createDealMutation.isPending || updateDealMutation.isPending;

  return (
    <AdminLayout title="Deals" description="Track your sales pipeline">
      <div className="space-y-6" data-testid="admin-deals">
        <div className="flex items-center justify-end">
          <Button onClick={handleOpenCreateDialog} data-testid="button-add-deal">
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Deals</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-deals"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {dealsError ? (
              <div className="flex items-center justify-center py-8 text-destructive gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load deals</span>
              </div>
            ) : dealsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No deals found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDeals?.map((deal) => (
                      <TableRow key={deal.id} data-testid={`row-deal-${deal.id}`}>
                        <TableCell className="font-medium">{deal.title || "—"}</TableCell>
                        <TableCell>{deal.contactName}</TableCell>
                        <TableCell>${(deal.value || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStageColor(deal.stage) as any}>
                            {(deal.stage || "lead").replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{deal.probability || 0}%</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-deal-actions-${deal.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleOpenEditDialog(deal)}
                                data-testid={`button-edit-deal-${deal.id}`}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletingDeal(deal)}
                                className="text-destructive"
                                data-testid={`button-delete-deal-${deal.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingDeal ? "Edit Deal" : "Add New Deal"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter deal title" 
                        {...field} 
                        data-testid="input-deal-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-deal-contact">
                          <SelectValue placeholder="Select a contact" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts?.map((contact) => (
                          <SelectItem 
                            key={contact.id} 
                            value={contact.id}
                            data-testid={`select-contact-${contact.id}`}
                          >
                            {contact.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          data-testid="input-deal-value"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="probability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Probability (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          placeholder="0" 
                          {...field} 
                          data-testid="input-deal-probability"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-deal-stage">
                          <SelectValue placeholder="Select a stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lead" data-testid="select-stage-lead">Lead</SelectItem>
                        <SelectItem value="proposal" data-testid="select-stage-proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation" data-testid="select-stage-negotiation">Negotiation</SelectItem>
                        <SelectItem value="closed_won" data-testid="select-stage-closed-won">Closed Won</SelectItem>
                        <SelectItem value="closed_lost" data-testid="select-stage-closed-lost">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes about this deal" 
                        className="resize-none" 
                        rows={3}
                        {...field} 
                        data-testid="input-deal-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseDialog}
                  data-testid="button-cancel-deal"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  data-testid="button-submit-deal"
                >
                  {isSubmitting ? "Saving..." : editingDeal ? "Update Deal" : "Create Deal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDeal} onOpenChange={(open) => !open && setDeletingDeal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDeal?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDeal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteDealMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
