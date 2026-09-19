"use client";

import React from "react";
import { Plus, Trash2, Boxes, Sparkles, CheckCircle2, AlertTriangle, Info, Loader2 } from "lucide-react";
import { RecipeLine, StockOption } from "@/types/carta";

interface ProductRecipeEditorProps {
  formRecipe: RecipeLine[];
  stockOptions: StockOption[];
  recipePickBarcode: string;
  setRecipePickBarcode: (val: string) => void;
  recipePickQty: string;
  setRecipePickQty: (val: string) => void;
  addRecipeLine: () => void;
  removeRecipeLine: (barcode: string) => void;
  isQuickCreatingStock: boolean;
  setIsQuickCreatingStock: (val: boolean) => void;
  newStockName: string;
  setNewStockName: (val: string) => void;
  newStockCategory: string;
  setNewStockCategory: (val: string) => void;
  newStockUnit: string;
  setNewStockUnit: (val: string) => void;
  newStockInitialQty: string;
  setNewStockInitialQty: (val: string) => void;
  newStockUsedPerDish: string;
  setNewStockUsedPerDish: (val: string) => void;
  quickStockLoading: boolean;
  quickStockMsg: { type: "success" | "error"; text: string } | null;
  handleQuickCreateStock: (e: React.FormEvent) => void;
  formIngredientsManual: string;
  setFormIngredientsManual: (val: string) => void;
}

export default function ProductRecipeEditor({
  formRecipe,
  stockOptions,
  recipePickBarcode,
  setRecipePickBarcode,
  recipePickQty,
  setRecipePickQty,
  addRecipeLine,
  removeRecipeLine,
  isQuickCreatingStock,
  setIsQuickCreatingStock,
  newStockName,
  setNewStockName,
  newStockCategory,
  setNewStockCategory,
  newStockUnit,
  setNewStockUnit,
  newStockInitialQty,
  setNewStockInitialQty,
  newStockUsedPerDish,
  setNewStockUsedPerDish,
  quickStockLoading,
  quickStockMsg,
  handleQuickCreateStock,
  formIngredientsManual,
  setFormIngredientsManual,
}: ProductRecipeEditorProps) {
  return (
    <div
      style={{
        background: "var(--b1-color-surface-subtle)",
        border: "1.5px solid var(--b1-color-border-light)",
        borderRadius: "var(--b1-radius-lg)",
        padding: 14,
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <label className="b1-form-label" style={{ margin: 0, fontWeight: 800, color: "var(--b1-color-text-main)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Boxes style={{ width: 16, height: 16, color: "var(--b1-color-primary)" }} />
          <span>Ingredientes y Descuento de Stock</span>
        </label>
        <span style={{ fontSize: 11, background: "rgba(59, 130, 246, 0.12)", color: "#2563eb", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
          {formRecipe.length} {formRecipe.length === 1 ? "insumo vinculado" : "insumos vinculados"}
        </span>
      </div>

      <p style={{ fontSize: 12, color: "var(--b1-color-text-muted)", margin: "0 0 12px", lineHeight: 1.35 }}>
        Elegí los ingredientes desde tu <strong>Stock</strong>. Si un ingrediente no existe aún, podés crearlo al instante y se guardará en tu inventario.
      </p>

      {/* Feedback Message */}
      {quickStockMsg && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "var(--b1-radius-md)",
            marginBottom: 10,
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: quickStockMsg.type === "success" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: quickStockMsg.type === "success" ? "#16a34a" : "#dc2626",
            border: `1px solid ${quickStockMsg.type === "success" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
          }}
        >
          {quickStockMsg.type === "success" ? (
            <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} />
          ) : (
            <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
          )}
          <span>{quickStockMsg.text}</span>
        </div>
      )}

      {/* Assigned Recipe Lines List */}
      {formRecipe.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {formRecipe.map((line) => {
            const stockItem = stockOptions.find((o) => o.barcode === line.barcode);
            const currentStock = stockItem ? stockItem.stock : 0;
            const isLowStock = currentStock <= 0;

            return (
              <div
                key={line.barcode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--b1-color-surface, #fff)",
                  border: "1px solid var(--b1-color-border-light, #E2E8F0)",
                  borderRadius: "var(--b1-radius-md, 12px)",
                  padding: "10px 14px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                  <strong style={{ fontSize: 13, color: "var(--b1-color-text-main, #0F172A)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {line.name}
                  </strong>
                  <div style={{ fontSize: 11, color: "var(--b1-color-text-muted, #64748B)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span>
                      Descuenta: <strong style={{ color: "var(--b1-color-text-main, #0F172A)" }}>{line.qty} {line.unit || "u."}</strong> por plato
                    </span>
                    <span>•</span>
                    <span style={{ color: isLowStock ? "#DC2626" : "var(--b1-color-text-muted, #64748B)" }}>
                      Stock: <strong style={{ color: isLowStock ? "#DC2626" : "#059669" }}>{currentStock} {line.unit || "u."}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeRecipeLine(line.barcode)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--b1-color-text-muted, #94A3B8)",
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#FEE2E2";
                    (e.currentTarget as HTMLElement).style.color = "#DC2626";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--b1-color-text-muted, #94A3B8)";
                  }}
                  title="Quitar ingrediente de la receta"
                >
                  <Trash2 style={{ width: 16, height: 16 }} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            padding: "14px",
            textAlign: "center",
            background: "var(--b1-color-surface)",
            border: "1px dashed var(--b1-color-border-light)",
            borderRadius: "var(--b1-radius-md, 12px)",
            marginBottom: 12,
            fontSize: 12,
            color: "var(--b1-color-text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Info style={{ width: 14, height: 14, color: "var(--b1-color-primary)" }} />
          <span>Todavía no agregaste ingredientes del stock. Seleccionalos abajo para descontar stock automáticamente.</span>
        </div>
      )}

      {/* Selector Bar: Dropdown + Qty + Add Button */}
      {!isQuickCreatingStock && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              className="b1-input"
              style={{ flex: 1, fontSize: 13 }}
              value={recipePickBarcode}
              onChange={(e) => {
                if (e.target.value === "__create_new__") {
                  setIsQuickCreatingStock(true);
                  setRecipePickBarcode("");
                } else {
                  setRecipePickBarcode(e.target.value);
                }
              }}
            >
              <option value="">-- Seleccionar ingrediente del Stock --</option>
              <option value="__create_new__" style={{ fontWeight: 800, color: "var(--b1-color-primary)" }}>
                + Crear nuevo ingrediente en Stock...
              </option>
              {stockOptions.map((o) => (
                <option key={o.barcode} value={o.barcode}>
                  {o.name} ({o.stock} {o.unit || "u."} en stock)
                </option>
              ))}
            </select>

            <div style={{ display: "flex", alignItems: "center", width: 100 }}>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="Cant."
                className="b1-input"
                style={{ textAlign: "center", fontSize: 13, padding: "8px 4px" }}
                value={recipePickQty}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setRecipePickQty(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="b1-btn-primary"
              style={{ width: "auto", padding: "0 14px", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              onClick={addRecipeLine}
              disabled={!recipePickBarcode}
              title="Vincular ingrediente"
            >
              <Plus style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Quick CTA to create new stock */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setIsQuickCreatingStock(true)}
              style={{
                background: "none",
                border: "none",
                color: "var(--b1-color-primary)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 0",
              }}
            >
              <Plus style={{ width: 13, height: 13 }} />
              <span>¿El ingrediente no está en la lista? Crealo acá</span>
            </button>
          </div>
        </div>
      )}

      {/* ── INLINE QUICK STOCK CREATION FORM ────────────────────── */}
      {isQuickCreatingStock && (
        <div
          style={{
            background: "var(--b1-color-surface)",
            border: "2px solid var(--b1-color-primary)",
            borderRadius: "var(--b1-radius-md)",
            padding: 14,
            marginTop: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <strong style={{ fontSize: 13, color: "var(--b1-color-text-main)", display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles style={{ width: 15, height: 15, color: "var(--b1-color-primary)" }} />
              <span>Crear Ingrediente y Guardar en Stock</span>
            </strong>
            <button
              type="button"
              onClick={() => setIsQuickCreatingStock(false)}
              style={{ background: "none", border: "none", color: "var(--b1-color-text-muted)", cursor: "pointer", fontSize: 13 }}
            >
              ✕ Cancelar
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 3 }}>
                Nombre del Ingrediente *
              </label>
              <input
                type="text"
                placeholder="Ej: Masa de Pizza, Panceta, Tomate, Carne Picada..."
                className="b1-input"
                style={{ fontSize: 13 }}
                value={newStockName}
                onChange={(e) => setNewStockName(e.target.value)}
              />
            </div>

            <div>
              <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 3 }}>
                Categoría en Stock
              </label>
              <select
                className="b1-input"
                style={{ fontSize: 12 }}
                value={newStockCategory}
                onChange={(e) => setNewStockCategory(e.target.value)}
              >
                <option value="Cocina">Cocina</option>
                <option value="Carnes">Carnes</option>
                <option value="Verduras">Verduras</option>
                <option value="Lácteos">Lácteos</option>
                <option value="Panadería">Panadería</option>
                <option value="Fiambres">Fiambres</option>
                <option value="Condimentos">Condimentos</option>
                <option value="Bebidas">Bebidas</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 3 }}>
                Unidad de Medida
              </label>
              <select
                className="b1-input"
                style={{ fontSize: 12 }}
                value={newStockUnit}
                onChange={(e) => setNewStockUnit(e.target.value)}
              >
                <option value="unidades">unidades</option>
                <option value="kg">kilogramos (kg)</option>
                <option value="g">gramos (g)</option>
                <option value="litros">litros</option>
                <option value="ml">mililitros (ml)</option>
                <option value="porciones">porciones</option>
                <option value="paquete">paquete</option>
              </select>
            </div>

            <div>
              <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 3 }}>
                Stock Inicial Disponible
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="10"
                className="b1-input"
                style={{ fontSize: 12 }}
                value={newStockInitialQty}
                onChange={(e) => setNewStockInitialQty(e.target.value)}
              />
            </div>

            <div>
              <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 3 }}>
                Usa por Plato (descuento)
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="1"
                className="b1-input"
                style={{ fontSize: 12 }}
                value={newStockUsedPerDish}
                onChange={(e) => setNewStockUsedPerDish(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="b1-btn-primary"
              style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "10px" }}
              onClick={handleQuickCreateStock}
              disabled={quickStockLoading}
            >
              {quickStockLoading ? (
                <>
                  <Loader2 className="animate-spin mr-1" style={{ width: 14, height: 14 }} /> Guardando en Stock...
                </>
              ) : (
                <>
                  <CheckCircle2 style={{ width: 14, height: 14 }} /> Guardar en Stock y Vincular al Plato
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Customer-Facing Ingredients Preview & Extra Notes */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--b1-color-border-light)" }}>
        <label className="b1-form-label" style={{ fontSize: 11, color: "var(--b1-color-text-muted)", marginBottom: 4 }}>
          Ingredientes visibles para los clientes en el menú:
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {formRecipe.length > 0 ? (
            formRecipe.map((r) => (
              <span
                key={r.barcode}
                style={{
                  background: "var(--b1-color-surface-subtle)",
                  color: "var(--b1-color-text-main)",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--b1-color-border-light)",
                }}
              >
                {r.name}
              </span>
            ))
          ) : (
            <span style={{ fontSize: 11, color: "var(--b1-color-text-muted)", fontStyle: "italic" }}>
              (Se generarán automáticamente según los insumos seleccionados arriba)
            </span>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <label className="b1-form-label" style={{ fontSize: 11, marginBottom: 2 }}>
            Ingredientes adicionales o personalizados (separados por coma):
          </label>
          <input
            type="text"
            placeholder="Ej: Salsa de la casa, orégano, pan artesanal..."
            className="b1-input"
            style={{ fontSize: 12 }}
            value={formIngredientsManual}
            onChange={(e) => setFormIngredientsManual(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
