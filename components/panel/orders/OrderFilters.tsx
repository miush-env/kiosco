"use client";

import React from "react";
import { ClipboardList, Clock, CheckCircle2, Ban } from "lucide-react";
import { OrderFilter } from "@/types/panel";

interface OrderFiltersProps {
  orderFilter: OrderFilter;
  setOrderFilter: (filter: OrderFilter) => void;
  orderStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export default function OrderFilters({
  orderFilter,
  setOrderFilter,
  orderStats,
}: OrderFiltersProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 mb-5">
      {/* 1. Todos */}
      <button
        type="button"
        onClick={() => setOrderFilter("all")}
        style={{
          background: orderFilter === "all" ? "var(--adm-surface-subtle)" : "var(--adm-surface)",
          borderColor: "var(--adm-border)",
          padding: "12px 16px",
        }}
        className={`w-full rounded-2xl flex flex-row items-center justify-center gap-2.5 sm:gap-3 whitespace-nowrap transition-all cursor-pointer border shadow-2xs active:scale-[0.98] ${
          orderFilter === "all"
            ? "ring-2 ring-slate-400/40 shadow-xs"
            : "hover:border-slate-400/60"
        }`}
      >
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            orderFilter === "all"
              ? "bg-slate-800 dark:bg-slate-700 text-white shadow-2xs"
              : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          <ClipboardList className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span style={{ color: "var(--adm-text-main)" }} className="text-sm sm:text-base font-black tracking-tight">
          Todos
        </span>
        <span style={{ color: "var(--adm-text-muted)" }} className="text-xs sm:text-sm font-extrabold">
          ({orderStats.total})
        </span>
      </button>

      {/* 2. Pendientes */}
      <button
        type="button"
        onClick={() => setOrderFilter("pendiente")}
        style={{
          background: orderFilter === "pendiente" ? "rgba(245, 158, 11, 0.15)" : "var(--adm-surface)",
          borderColor: orderFilter === "pendiente" ? "rgba(245, 158, 11, 0.6)" : "var(--adm-border)",
          padding: "12px 16px",
        }}
        className={`w-full rounded-2xl flex flex-row items-center justify-center gap-2.5 sm:gap-3 whitespace-nowrap transition-all cursor-pointer border shadow-2xs active:scale-[0.98] ${
          orderFilter === "pendiente"
            ? "ring-2 ring-amber-500/30 shadow-xs"
            : "hover:border-amber-400/60"
        }`}
      >
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            orderFilter === "pendiente"
              ? "bg-amber-500 text-white shadow-2xs"
              : "bg-amber-500/15 text-amber-500 dark:text-amber-400"
          }`}
        >
          <Clock className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span style={{ color: orderFilter === "pendiente" ? "#f59e0b" : "var(--adm-text-main)" }} className="text-sm sm:text-base font-black tracking-tight">
          Pendientes
        </span>
        <span style={{ color: orderStats.pending > 0 ? "#f59e0b" : "var(--adm-text-muted)" }} className="text-xs sm:text-sm font-extrabold">
          ({orderStats.pending})
        </span>
      </button>

      {/* 3. Cobrados */}
      <button
        type="button"
        onClick={() => setOrderFilter("aprobado")}
        style={{
          background: orderFilter === "aprobado" ? "rgba(16, 185, 129, 0.15)" : "var(--adm-surface)",
          borderColor: orderFilter === "aprobado" ? "rgba(16, 185, 129, 0.6)" : "var(--adm-border)",
          padding: "12px 16px",
        }}
        className={`w-full rounded-2xl flex flex-row items-center justify-center gap-2.5 sm:gap-3 whitespace-nowrap transition-all cursor-pointer border shadow-2xs active:scale-[0.98] ${
          orderFilter === "aprobado"
            ? "ring-2 ring-emerald-500/30 shadow-xs"
            : "hover:border-emerald-400/60"
        }`}
      >
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            orderFilter === "aprobado"
              ? "bg-emerald-600 text-white shadow-2xs"
              : "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span style={{ color: orderFilter === "aprobado" ? "#10b981" : "var(--adm-text-main)" }} className="text-sm sm:text-base font-black tracking-tight">
          Cobrados
        </span>
        <span style={{ color: orderStats.approved > 0 ? "#10b981" : "var(--adm-text-muted)" }} className="text-xs sm:text-sm font-extrabold">
          ({orderStats.approved})
        </span>
      </button>

      {/* 4. Cancelados */}
      <button
        type="button"
        onClick={() => setOrderFilter("rechazado")}
        style={{
          background: orderFilter === "rechazado" ? "rgba(239, 68, 68, 0.15)" : "var(--adm-surface)",
          borderColor: orderFilter === "rechazado" ? "rgba(239, 68, 68, 0.6)" : "var(--adm-border)",
          padding: "12px 16px",
        }}
        className={`w-full rounded-2xl flex flex-row items-center justify-center gap-2.5 sm:gap-3 whitespace-nowrap transition-all cursor-pointer border shadow-2xs active:scale-[0.98] ${
          orderFilter === "rechazado"
            ? "ring-2 ring-rose-500/30 shadow-xs"
            : "hover:border-rose-400/60"
        }`}
      >
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            orderFilter === "rechazado"
              ? "bg-rose-600 text-white shadow-2xs"
              : "bg-rose-500/15 text-rose-500 dark:text-rose-400"
          }`}
        >
          <Ban className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span style={{ color: orderFilter === "rechazado" ? "#ef4444" : "var(--adm-text-main)" }} className="text-sm sm:text-base font-black tracking-tight">
          Cancelados
        </span>
        <span style={{ color: orderStats.rejected > 0 ? "#ef4444" : "var(--adm-text-muted)" }} className="text-xs sm:text-sm font-extrabold">
          ({orderStats.rejected})
        </span>
      </button>
    </div>
  );
}
