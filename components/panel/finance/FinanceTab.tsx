"use client";

import React from "react";
import { Sale, Expense, FinancePeriod } from "@/types/panel";
import FinanceMetricsCards from "./FinanceMetricsCards";
import ExpensesSection from "./ExpensesSection";
import ManualSaleModal from "./ManualSaleModal";
import ManualExpenseModal from "./ManualExpenseModal";

interface FinanceTabProps {
  sales: Sale[];
  expenses: Expense[];
  financePeriod: FinancePeriod;
  setFinancePeriod: (p: FinancePeriod) => void;
  filteredSales: Sale[];
  filteredExpenses: Expense[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  isManualSaleOpen: boolean;
  setIsManualSaleOpen: (open: boolean) => void;
  manualSaleAmount: string;
  setManualSaleAmount: (amount: string) => void;
  manualSaleDesc: string;
  setManualSaleDesc: (desc: string) => void;
  manualSaleMethod: string;
  setManualSaleMethod: (method: string) => void;
  onManualSaleSubmit: (e: React.FormEvent) => void;

  isManualExpenseOpen: boolean;
  setIsManualExpenseOpen: (open: boolean) => void;
  manualExpenseAmount: string;
  setManualExpenseAmount: (amount: string) => void;
  manualExpenseDesc: string;
  setManualExpenseDesc: (desc: string) => void;
  manualExpenseCategory: string;
  setManualExpenseCategory: (cat: string) => void;
  onManualExpenseSubmit: (e: React.FormEvent) => void;
}

export default function FinanceTab({
  financePeriod,
  setFinancePeriod,
  filteredSales,
  filteredExpenses,
  totalIncome,
  totalExpense,
  netBalance,
  isManualSaleOpen,
  setIsManualSaleOpen,
  manualSaleAmount,
  setManualSaleAmount,
  manualSaleDesc,
  setManualSaleDesc,
  manualSaleMethod,
  setManualSaleMethod,
  onManualSaleSubmit,
  isManualExpenseOpen,
  setIsManualExpenseOpen,
  manualExpenseAmount,
  setManualExpenseAmount,
  manualExpenseDesc,
  setManualExpenseDesc,
  manualExpenseCategory,
  setManualExpenseCategory,
  onManualExpenseSubmit,
}: FinanceTabProps) {
  return (
    <div className="space-y-4 pt-1">
      {/* Metrics Cards */}
      <FinanceMetricsCards
        financePeriod={financePeriod}
        setFinancePeriod={setFinancePeriod}
        filteredSales={filteredSales}
        filteredExpenses={filteredExpenses}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        netBalance={netBalance}
      />

      {/* Expenses & Sales List + Action Buttons */}
      <ExpensesSection
        filteredSales={filteredSales}
        filteredExpenses={filteredExpenses}
        onOpenManualSale={() => setIsManualSaleOpen(true)}
        onOpenManualExpense={() => setIsManualExpenseOpen(true)}
      />

      {/* Modals */}
      <ManualSaleModal
        isOpen={isManualSaleOpen}
        onClose={() => setIsManualSaleOpen(false)}
        onSubmit={onManualSaleSubmit}
        amount={manualSaleAmount}
        setAmount={setManualSaleAmount}
        desc={manualSaleDesc}
        setDesc={setManualSaleDesc}
        method={manualSaleMethod}
        setMethod={setManualSaleMethod}
      />

      <ManualExpenseModal
        isOpen={isManualExpenseOpen}
        onClose={() => setIsManualExpenseOpen(false)}
        onSubmit={onManualExpenseSubmit}
        amount={manualExpenseAmount}
        setAmount={setManualExpenseAmount}
        desc={manualExpenseDesc}
        setDesc={setManualExpenseDesc}
        category={manualExpenseCategory}
        setCategory={setManualExpenseCategory}
      />
    </div>
  );
}
