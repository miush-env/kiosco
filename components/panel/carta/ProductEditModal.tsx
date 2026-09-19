"use client";

import React from "react";
import {
  X,
  UtensilsCrossed,
  LayoutGrid,
  DollarSign,
  FileText,
  Star,
  Clock,
  Camera,
  Check,
  Loader2,
} from "lucide-react";
import { Product, Category, RecipeLine, StockOption } from "@/types/carta";
import ProductRecipeEditor from "./ProductRecipeEditor";

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  formName: string;
  setFormName: (v: string) => void;
  formCategoryId: string;
  setFormCategoryId: (v: string) => void;
  realCategories: Category[];
  formNewCatName: string;
  setFormNewCatName: (v: string) => void;
  formNewCatIcon: string;
  setFormNewCatIcon: (v: string) => void;
  formPrice: string;
  setFormPrice: (v: string) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formBadge: string;
  setFormBadge: (v: string) => void;
  formPrepTime: string;
  setFormPrepTime: (v: string) => void;
  formImage: string | null;
  setFormImage: (v: string | null) => void;
  imageUploading: boolean;
  handleImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProduct: (e: React.FormEvent) => void;

  // Recipe & Stock Props
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

export default function ProductEditModal({
  isOpen,
  onClose,
  editingProduct,
  formName,
  setFormName,
  formCategoryId,
  setFormCategoryId,
  realCategories,
  formNewCatName,
  setFormNewCatName,
  formNewCatIcon,
  setFormNewCatIcon,
  formPrice,
  setFormPrice,
  formDescription,
  setFormDescription,
  formBadge,
  setFormBadge,
  formPrepTime,
  setFormPrepTime,
  formImage,
  setFormImage,
  imageUploading,
  handleImageFileChange,
  handleSaveProduct,
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
}: ProductEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="b1-modal-backdrop" onClick={onClose}>
      <div
        className="b1-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: "28px 28px 0 0",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sheet Drag Handle */}
        <div className="b1-sheet-drag-handle"></div>

        {/* Hero Header */}
        <div
          className="b1-detail-hero-wrapper"
          style={{
            position: "relative",
            height: formImage ? 150 : 54,
            background: formImage ? "#000" : "var(--b1-color-surface-subtle)",
            overflow: "hidden",
            borderRadius: "28px 28px 0 0",
          }}
        >
          {formImage && (
            <>
              <img
                src={formImage}
                alt="Preview"
                className="b1-detail-hero-img"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "70%",
                  background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />
            </>
          )}

          <div className="b1-detail-nav-top">
            <div
              style={{
                fontWeight: 800,
                fontSize: 14,
                color: formImage ? "#fff" : "var(--b1-color-text-main)",
                textShadow: formImage ? "0 1px 4px rgba(0,0,0,0.8)" : "none",
              }}
            >
              {editingProduct ? `Editar Plato: ${editingProduct.name}` : "Crear Nuevo Plato"}
            </div>
            <button
              type="button"
              className="b1-detail-circle-btn"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveProduct} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div className="b1-detail-body" style={{ overflowY: "auto", flex: 1, padding: "18px 20px" }}>
            
            {/* 1. Name */}
            <div className="b1-form-group">
              <label className="b1-form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <UtensilsCrossed style={{ width: 14, height: 14 }} />
                <span>Nombre del Plato *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Hamburguesa Completa, Pizza Especial, etc."
                className="b1-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {/* 2. Category Selection */}
            <div className="b1-form-group">
              <label className="b1-form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <LayoutGrid style={{ width: 14, height: 14 }} />
                <span>Categoría en Menú *</span>
              </label>
              <select
                className="b1-input"
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
              >
                {realCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon || "🍽️"} {c.name}
                  </option>
                ))}
                <option value="__new__">+ Crear nueva categoría de menú...</option>
              </select>
            </div>

            {/* New Category Inputs */}
            {formCategoryId === "__new__" && (
              <div
                style={{
                  background: "var(--b1-color-surface-subtle)",
                  borderRadius: "var(--b1-radius-md)",
                  padding: 12,
                  border: "1px solid var(--b1-color-border-light)",
                  marginBottom: 14,
                }}
              >
                <div className="b1-form-group" style={{ marginBottom: 8 }}>
                  <label className="b1-form-label">Nombre Nueva Categoría</label>
                  <input
                    type="text"
                    placeholder="Ej: Minutas, Pastas, Postres..."
                    className="b1-input"
                    value={formNewCatName}
                    onChange={(e) => setFormNewCatName(e.target.value)}
                  />
                </div>
                <div className="b1-form-group" style={{ marginBottom: 0 }}>
                  <label className="b1-form-label">Emoji / Ícono</label>
                  <input
                    type="text"
                    placeholder="🍝"
                    maxLength={2}
                    className="b1-input"
                    style={{ width: 80, textAlign: "center" }}
                    value={formNewCatIcon}
                    onChange={(e) => setFormNewCatIcon(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 3. Price */}
            <div className="b1-form-group">
              <label className="b1-form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <DollarSign style={{ width: 14, height: 14 }} />
                <span>Precio al Público ($) *</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                placeholder="12000"
                className="b1-input"
                style={{ fontSize: 16, fontWeight: 800, color: "var(--b1-color-primary)" }}
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
            </div>

            {/* 4. Description */}
            <div className="b1-form-group">
              <label className="b1-form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FileText style={{ width: 14, height: 14 }} />
                <span>Descripción del Plato</span>
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Pan casero brioche, doble medallón de carne 120g, queso cheddar fundido..."
                className="b1-input"
                style={{ resize: "none", height: "auto" }}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* 5. Ingredients & Stock Recipe Editor */}
            <ProductRecipeEditor
              formRecipe={formRecipe}
              stockOptions={stockOptions}
              recipePickBarcode={recipePickBarcode}
              setRecipePickBarcode={setRecipePickBarcode}
              recipePickQty={recipePickQty}
              setRecipePickQty={setRecipePickQty}
              addRecipeLine={addRecipeLine}
              removeRecipeLine={removeRecipeLine}
              isQuickCreatingStock={isQuickCreatingStock}
              setIsQuickCreatingStock={setIsQuickCreatingStock}
              newStockName={newStockName}
              setNewStockName={setNewStockName}
              newStockCategory={newStockCategory}
              setNewStockCategory={setNewStockCategory}
              newStockUnit={newStockUnit}
              setNewStockUnit={setNewStockUnit}
              newStockInitialQty={newStockInitialQty}
              setNewStockInitialQty={setNewStockInitialQty}
              newStockUsedPerDish={newStockUsedPerDish}
              setNewStockUsedPerDish={setNewStockUsedPerDish}
              quickStockLoading={quickStockLoading}
              quickStockMsg={quickStockMsg}
              handleQuickCreateStock={handleQuickCreateStock}
              formIngredientsManual={formIngredientsManual}
              setFormIngredientsManual={setFormIngredientsManual}
            />

            {/* 6. Badge & Prep Time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div className="b1-form-group" style={{ margin: 0 }}>
                <label className="b1-form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Star style={{ width: 14, height: 14 }} />
                  <span>Badge / Etiqueta</span>
                </label>
                <input
                  type="text"
                  placeholder="Más Pedido, Nuevo..."
                  className="b1-input"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                />
              </div>
              <div className="b1-form-group" style={{ margin: 0 }}>
                <label className="b1-form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock style={{ width: 14, height: 14 }} />
                  <span>Tiempo Estimado</span>
                </label>
                <input
                  type="text"
                  placeholder="20-25 min"
                  className="b1-input"
                  value={formPrepTime}
                  onChange={(e) => setFormPrepTime(e.target.value)}
                />
              </div>
            </div>

            {/* 7. Photo Upload */}
            <div className="b1-form-group">
              <label className="b1-form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Camera style={{ width: 14, height: 14 }} />
                <span>Foto del Plato</span>
              </label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ fontSize: 12, flex: 1 }}
                  onChange={handleImageFileChange}
                />
              </div>
              <div style={{ marginTop: 6 }}>
                <input
                  type="text"
                  placeholder="O pegá URL directa de imagen..."
                  className="b1-input"
                  style={{ fontSize: 12 }}
                  value={formImage || ""}
                  onChange={(e) => setFormImage(e.target.value)}
                />
              </div>
              {imageUploading && (
                <span style={{ fontSize: 11, color: "var(--b1-color-primary)", fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} /> Subiendo imagen...
                </span>
              )}
            </div>
          </div>

          {/* Sticky Footer CTA */}
          <div className="b1-detail-footer" style={{ borderTop: "1px solid var(--b1-color-border-light)", display: "flex", gap: 8, padding: "14px 20px" }}>
            <button type="submit" className="b1-btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              <Check style={{ width: 16, height: 16 }} />
              <span>{editingProduct ? "Guardar Cambios" : "Crear Plato"}</span>
            </button>
            <button
              type="button"
              className="b1-cat-pill"
              style={{ padding: "12px 18px", borderRadius: "var(--b1-radius-pill)" }}
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
