"use client";

import React from "react";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { FinancePeriod, Sale, Expense, formatMoney } from "@/types/panel";

interface FinanceMetricsCardsProps {
  financePeriod: FinancePeriod;
  setFinancePeriod: (period: FinancePeriod) => void;
  filteredSales: Sale[];
  filteredExpenses: Expense[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export default function FinanceMetricsCards({
  financePeriod,
  setFinancePeriod,
  filteredSales,
  filteredExpenses,
  totalIncome,
  totalExpense,
  netBalance,
}: FinanceMetricsCardsProps) {
  return (
    <div className="space-y-4">
      {/* 1. Encabezado de Sección y Filtros de Tiempo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">
              Balance y Finanzas
            </h2>
            <p className="text-xs text-gray-500">
              Resumen económico del local
            </p>
          </div>
        </div>

        {/* Filtros Segmentados */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl gap-1 border border-gray-200/50 self-start sm:self-auto">
          {(
            [
              { id: "today", label: "Hoy" },
              { id: "week", label: "Esta Semana" },
              { id: "month", label: "Este Mes" },
              { id: "all", label: "Todo" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFinancePeriod(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                financePeriod === id
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Tarjeta Principal (Hero Card): Balance Neto */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white p-5 sm:p-6 rounded-3xl shadow-md relative overflow-hidden border border-gray-800">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Balance Neto (
            {financePeriod === "today"
              ? "Hoy"
              : financePeriod === "week"
                ? "Esta Semana"
                : financePeriod === "month"
                  ? "Este Mes"
                  : "Todo"}
            )
          </span>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              netBalance >= 0
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
            }`}
          >
            {netBalance >= 0 ? (
              <>
                <TrendingUp className="w-3 h-3" />
                <span>Positivo</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3" />
                <span>Déficit</span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-baseline gap-1 my-2">
          <span className="text-2xl font-light text-gray-400">$</span>
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            {formatMoney(netBalance)}
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-1">
          Ganancia neta real tras deducir compras y gastos de cocina.
        </p>
      </div>

      {/* 3. Desglose en 2 Cards Secundarias de Alto Impacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card Ingresos */}
        <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Ingresos Totales
            </span>
            <div className="text-xl font-extrabold text-gray-900 font-mono">
              +${formatMoney(totalIncome)}
            </div>
            <span className="text-xs font-medium text-emerald-700 mt-0.5 block">
              {filteredSales.length} {filteredSales.length === 1 ? "venta registrada" : "ventas registradas"}
            </span>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* Card Gastos */}
        <div className="p-4 bg-rose-50/60 border border-rose-200/60 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block mb-1">
              Gastos y Compras
            </span>
            <div className="text-xl font-extrabold text-gray-900 font-mono">
              -${formatMoney(totalExpense)}
            </div>
            <span className="text-xs font-medium text-rose-700 mt-0.5 block">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? "egreso registrado" : "egresos registrados"}
            </span>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
