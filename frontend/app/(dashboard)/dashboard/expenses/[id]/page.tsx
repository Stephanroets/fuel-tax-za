"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft, Edit, Trash2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpenseCategory } from "@/lib/types/database";
import { formatZAR } from "@/lib/utils/currency";
import { api } from "@/lib/api/client";

const categoryLabels: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FUEL_LOG]: "Fuel",
  [ExpenseCategory.MECHANIC_SERVICE]: "Service & Repairs",
  [ExpenseCategory.MAINTENANCE_TOPUP]: "Maintenance Top-up",
  [ExpenseCategory.TIRES]: "Tyres",
  [ExpenseCategory.FIXED_ADMIN]: "Fixed & Admin",
  [ExpenseCategory.CAR_WASH]: "Car Wash",
};

interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  vehicleReg: string;
  date: Date;
  supplierName?: string;
}

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const expenseId = params.id as string;
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load expense from backend API
  useEffect(() => {
    const fetchExpense = async () => {
      try {
        // Call Next.js API route instead of backend directly
        const token = localStorage.getItem('jwt_token');
        const res = await fetch(`/api/expenses/${expenseId}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const expenseData = await res.json();
        if (expenseData && expenseData.id) {
          setExpense({
            id: expenseData.id,
            category: expenseData.category,
            description: expenseData.description || 'Expense',
            amount: expenseData.amountZar || 0,
            vehicleReg: expenseData.vehicle?.registrationNumber || 'Unknown',
            date: expenseData.expenseDate ? new Date(expenseData.expenseDate) : (expenseData.createdAt ? new Date(expenseData.createdAt) : new Date()),
            supplierName: expenseData.supplierName,
          });
        }
      } catch (err) {
        console.error('Expense detail - Failed to fetch from backend:', err);
        // If authentication fails, redirect to login
        if (err instanceof Error && err.message.includes('HTTP 401')) {
          router.push('/login?error=session_expired');
        }
      }
      setLoading(false);
    };
    fetchExpense();
  }, [expenseId]);

  const handleDelete = async () => {
    try {
      // Call Next.js API route instead of backend directly
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.push('/dashboard/expenses');
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Expense not found</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/expenses">Back to Expenses</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/expenses">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-xl font-bold">Expense Details</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => router.push(`/dashboard/expenses/${expenseId}/edit`)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{expense.description}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-xl font-bold">{formatZAR(expense.amount)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Category</span>
              <span>{categoryLabels[expense.category]}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Vehicle</span>
              <span>{expense.vehicleReg}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Date</span>
              <span>{format(expense.date, "d MMM yyyy")}</span>
            </div>
            {expense.supplierName && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Supplier</span>
                <span>{expense.supplierName}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Expense
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
