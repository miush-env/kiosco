"use client";

import React from "react";
import { PlusCircle, MinusCircle } from "lucide-react";
import { Sale, Expense, formatMoney } from "@/types/panel";

interface ExpensesSectionProps {
  filteredSales: Sale[];
  filteredExpenses: Expense[];
  onOpenManualSale: () => void;
  onOpenManualExpense: () => void;
}

export default function ExpensesSection({
  filteredSales,
  filteredExpenses,
  onOpenManualSale,
  onOpenManualExpense,
}: ExpensesSectionProps) {
  return (
    <div className="space-y-4">
      {/* 4. Botonera de Acciones Explícitas para el Operador */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={onOpenManualSale}
          className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.2]" />
          <span>Registrar Venta</span>
        </button>

        <button
          type="button"
          onClick={onOpenManualExpense}
          className="py-3 px-4 bg-white hover:bg-rose-50/50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold rounded-2xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <MinusCircle className="w-4 h-4 text-rose-500 stroke-[2.2]" />
          <span>Registrar Gasto</span>
        </button>
      </div>

      {/* Sales & Expenses Lists */}
      <section style={{ padding: "16px 0 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Ventas & Pedidos List */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--adm-text-main)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="fas fa-arrow-down" style={{ color: "var(--adm-success)" }}></i> Ventas & Pedidos
            </h4>
            <span style={{ fontSize: 11, color: "var(--adm-text-muted)", fontWeight: 700 }}>
              {filteredSales.length} registros
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredSales.length === 0 ? (
              <div className="adm-empty-state" style={{ padding: "20px 14px", fontSize: 12 }}>
                No hay ventas registradas en este período.
              </div>
            ) : (
              filteredSales.map((s) => {
                let customerName = "Venta Mostrador";
                let statusText = "Aprobado";
                let shortCode = "";

                if (s.description) {
                  const match = s.description.match(/Pedido\s+([^\s-]+)\s*-\s*([^(]+)(?:\(([^)]+)\))?/i);
                  if (match) {
                    const rawId = match[1];
                    shortCode = rawId.includes("_")
                      ? "#" + rawId.split("_").pop()?.substring(0, 6).toUpperCase()
                      : "#" + rawId.slice(-6).toUpperCase();
                    customerName = match[2].trim();
                    if (match[3]) statusText = match[3].trim();
                  } else {
                    customerName = s.description;
                  }
                } else if (s.items && s.items.length > 0) {
                  customerName = s.items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
                }

                if (!shortCode && s.id) {
                  shortCode = s.id.includes("_")
                    ? "#" + s.id.split("_").pop()?.substring(0, 6).toUpperCase()
                    : "#" + s.id.slice(-6).toUpperCase();
                }

                const isCancelled =
                  statusText.toLowerCase().includes("cancelado") ||
                  statusText.toLowerCase().includes("rechazado");

                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "var(--b1-color-surface, #fff)",
                      border: "1px solid var(--b1-color-border, #E2E8F0)",
                      borderRadius: 14,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--adm-text-main, #0F172A)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {customerName}
                        </span>
                        <span
                          style={{
                            padding: "2px 7px",
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 800,
                            background: isCancelled ? "#FEE2E2" : "#ECFDF5",
                            color: isCancelled ? "#DC2626" : "#059669",
                            border: `1px solid ${isCancelled ? "#FECACA" : "#A7F3D0"}`,
                          }}
                        >
                          {statusText}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          color: "var(--adm-text-muted, #64748B)",
                          flexWrap: "wrap",
                        }}
                      >
                        {shortCode && (
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--adm-text-main, #0F172A)" }}>
                            {shortCode}
                          </span>
                        )}
                        {shortCode && <span>•</span>}
                        <span style={{ textTransform: "capitalize" }}>
                          {s.paymentMethod === "mercadopago"
                            ? "Mercado Pago"
                            : s.paymentMethod === "efectivo"
                              ? "Efectivo"
                              : s.paymentMethod || "Mostrador"}
                        </span>
                        <span>•</span>
                        <span>{s.date}</span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--adm-success, #10B981)",
                        flexShrink: 0,
                      }}
                    >
                      +${formatMoney(s.total)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Gastos Operativos List */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--adm-text-main)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="fas fa-arrow-up" style={{ color: "var(--adm-danger)" }}></i> Gastos Operativos
            </h4>
            <span style={{ fontSize: 11, color: "var(--adm-text-muted)", fontWeight: 700 }}>
              {filteredExpenses.length} registros
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredExpenses.length === 0 ? (
              <div className="adm-empty-state" style={{ padding: "20px 14px", fontSize: 12 }}>
                No hay gastos registrados en este período.
              </div>
            ) : (
              filteredExpenses.map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "var(--b1-color-surface, #fff)",
                    border: "1px solid var(--b1-color-border, #E2E8F0)",
                    borderRadius: 14,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--adm-text-main, #0F172A)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {e.description}
                      </span>
                      {e.category && (
                        <span
                          style={{
                            padding: "2px 7px",
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 700,
                            background: "var(--adm-surface-subtle, #F1F5F9)",
                            color: "var(--adm-text-muted, #64748B)",
                            border: "1px solid var(--b1-color-border, #E2E8F0)",
                          }}
                        >
                          {e.category}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--adm-text-muted, #64748B)" }}>
                      {e.date}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "var(--adm-danger, #EF4444)",
                      flexShrink: 0,
                    }}
                  >
                    -${formatMoney(e.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
