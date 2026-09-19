"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Sale, Expense, FinancePeriod } from "@/types/panel";

export function usePanelFinance() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [financePeriod, setFinancePeriod] = useState<FinancePeriod>("today");

  // Modals state
  const [isManualSaleOpen, setIsManualSaleOpen] = useState(false);
  const [manualSaleAmount, setManualSaleAmount] = useState("");
  const [manualSaleDesc, setManualSaleDesc] = useState("Venta de mostrador");
  const [manualSaleMethod, setManualSaleMethod] = useState("efectivo");

  const [isManualExpenseOpen, setIsManualExpenseOpen] = useState(false);
  const [manualExpenseAmount, setManualExpenseAmount] = useState("");
  const [manualExpenseDesc, setManualExpenseDesc] = useState("");
  const [manualExpenseCategory, setManualExpenseCategory] = useState("general");

  // Fetch finance data
  const fetchFinanceData = useCallback(async () => {
    try {
      const salesRes = await fetch("/api/finance/sales");
      const salesData = await salesRes.json();
      if (salesData.success) setSales(salesData.sales || []);

      const expRes = await fetch("/api/finance/expenses");
      const expData = await expRes.json();
      if (expData.success) setExpenses(expData.expenses || []);
    } catch (e) {
      console.error("Error fetching finance data:", e);
    }
  }, []);

  // Filtered sales based on period
  const filteredSales = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const localToday = new Date().toLocaleDateString("en-CA");
    const now = new Date();

    return sales.filter((s) => {
      if (financePeriod === "all") return true;
      if (financePeriod === "today") return s.date === today || s.date === localToday;
      const saleDate = new Date(s.date + "T12:00:00");
      const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
      if (financePeriod === "week") return diffDays <= 7 && diffDays >= -1;
      if (financePeriod === "month") return diffDays <= 30 && diffDays >= -1;
      return true;
    });
  }, [sales, financePeriod]);

  // Filtered expenses based on period
  const filteredExpenses = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const localToday = new Date().toLocaleDateString("en-CA");
    const now = new Date();

    return expenses.filter((e) => {
      if (financePeriod === "all") return true;
      if (financePeriod === "today") return e.date === today || e.date === localToday;
      const expDate = new Date(e.date + "T12:00:00");
      const diffDays = (now.getTime() - expDate.getTime()) / (1000 * 3600 * 24);
      if (financePeriod === "week") return diffDays <= 7 && diffDays >= -1;
      if (financePeriod === "month") return diffDays <= 30 && diffDays >= -1;
      return true;
    });
  }, [expenses, financePeriod]);

  const totalIncome = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  }, [filteredSales]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const netBalance = totalIncome - totalExpense;

  // Manual Sale Submit
  const handleManualSaleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSaleAmount) return;

    try {
      const res = await fetch("/api/finance/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: manualSaleAmount,
          description: manualSaleDesc,
          paymentMethod: manualSaleMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSales((prev) => [data.sale, ...prev]);
        setIsManualSaleOpen(false);
        setManualSaleAmount("");
      }
    } catch {
      alert("Error al registrar venta");
    }
  }, [manualSaleAmount, manualSaleDesc, manualSaleMethod]);

  // Manual Expense Submit
  const handleManualExpenseSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualExpenseAmount || !manualExpenseDesc) return;

    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: manualExpenseAmount,
          description: manualExpenseDesc,
          category: manualExpenseCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExpenses((prev) => [data.expense, ...prev]);
        setIsManualExpenseOpen(false);
        setManualExpenseAmount("");
        setManualExpenseDesc("");
      }
    } catch {
      alert("Error al registrar gasto");
    }
  }, [manualExpenseAmount, manualExpenseDesc, manualExpenseCategory]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  return {
    sales,
    setSales,
    expenses,
    setExpenses,
    financePeriod,
    setFinancePeriod,
    filteredSales,
    filteredExpenses,
    totalIncome,
    totalExpense,
    netBalance,
    fetchFinanceData,
    handleManualSaleSubmit,
    handleManualExpenseSubmit,
    // Modals
    isManualSaleOpen,
    setIsManualSaleOpen,
    manualSaleAmount,
    setManualSaleAmount,
    manualSaleDesc,
    setManualSaleDesc,
    manualSaleMethod,
    setManualSaleMethod,
    isManualExpenseOpen,
    setIsManualExpenseOpen,
    manualExpenseAmount,
    setManualExpenseAmount,
    manualExpenseDesc,
    setManualExpenseDesc,
    manualExpenseCategory,
    setManualExpenseCategory,
  };
}
