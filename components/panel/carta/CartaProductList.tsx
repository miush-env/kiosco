"use client";

import React from "react";
import {
  Plus,
  Search,
  Flame,
  RefreshCw,
  Loader2,
  X,
} from "lucide-react";
import { Product, Category, getCategoryLucideIcon, getCategoryCustomImage } from "@/types/carta";
import CartaProductCard from "./CartaProductCard";

interface CartaProductListProps {
  products: Product[];
  categories: Category[];
  realCategories: Category[];
  filteredProducts: Product[];
  selectedCategory: string;
  setSelectedCategory: (catId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  onOpenNewModal: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number, name: string) => void;
}

export default function CartaProductList({
  products,
  categories,
  realCategories,
  filteredProducts,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  loading,
  onOpenNewModal,
  onEditProduct,
  onDeleteProduct,
}: CartaProductListProps) {
  return (
    <>
      {/* ── 1. GREETING & ACTION HEADER ────────────────────────────────────── */}
      <section
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          padding: "4px 0 0 0",
        }}
      >
        {/* Title & Badge on Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--b1-color-text-main)", margin: 0, letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>
            Gestión de Carta
          </h2>
          <span style={{ fontSize: 12, fontWeight: 800, background: "rgba(245, 158, 11, 0.15)", color: "#D97706", padding: "3px 10px", borderRadius: 14, whiteSpace: "nowrap" }}>
            {products.length} {products.length === 1 ? "plato" : "platos"}
          </span>
        </div>

        {/* Action Button on Right */}
        <button
          type="button"
          className="b1-btn-primary"
          style={{
            width: "auto",
            padding: "8px 16px",
            fontSize: 13.5,
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            borderRadius: 12,
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
          onClick={onOpenNewModal}
        >
          <Plus style={{ width: 16, height: 16 }} />
          <span>Nuevo Plato</span>
        </button>
      </section>

      {/* ── 2. SEARCH BAR ──────────────────────────────────────────────────── */}
      <section className="b1-search-container" style={{ padding: "0 0 14px 0" }}>
        <div className="b1-search-box">
          <Search className="b1-search-icon" style={{ width: 16, height: 16 }} />
          <input
            type="text"
            className="b1-search-input"
            placeholder="Buscar por plato o ingrediente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--b1-color-text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 4,
              }}
              onClick={() => setSearchQuery("")}
              aria-label="Limpiar búsqueda"
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </section>

      {/* ── 3. CATEGORIES SCROLL ───────────────────────────────────────────── */}
      <section className="b1-categories-wrapper" style={{ position: "relative", top: "auto", zIndex: 2, padding: "0 0 12px 0" }}>
        <div className="b1-categories-scroll">
          <button
            type="button"
            className={`b1-category-pill ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            <Flame style={{ width: 15, height: 15, color: selectedCategory === "all" ? "#fff" : "#EA580C" }} />
            <span>Todos ({products.length})</span>
          </button>

          {realCategories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            const customImg = getCategoryCustomImage(cat.id, cat.name);
            const CatIcon = getCategoryLucideIcon(cat.id, cat.name);
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                className={`b1-category-pill ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {customImg ? (
                  <img
                    src={customImg}
                    alt={cat.name}
                    width={20}
                    height={20}
                    style={{
                      width: 20,
                      height: 20,
                      objectFit: "contain",
                      display: "inline-block",
                      flexShrink: 0,
                      imageRendering: "pixelated",
                    }}
                  />
                ) : (
                  <CatIcon style={{ width: 15, height: 15, color: isSelected ? "#fff" : "#EA580C" }} />
                )}
                <span>{cat.name} ({count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 4. PRODUCTS ROW LIST ───────────────────────────────────────────── */}
      <section className="b1-section-header" style={{ padding: "4px 0 10px 0", position: "relative", zIndex: 2, clear: "both" }}>
        <h3 className="b1-section-title" style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
          {searchQuery
            ? `Resultados para "${searchQuery}"`
            : selectedCategory === "all"
            ? "Todos los Platos"
            : realCategories.find((c) => c.id === selectedCategory)?.name || "Platos"}
        </h3>
      </section>

      <main className="b1-products-list" style={{ padding: "0 0 24px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--b1-color-text-muted)" }}>
            <Loader2 className="animate-spin" style={{ width: 24, height: 24, margin: "0 auto 8px" }} />
            <span>Cargando platos...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "var(--b1-color-surface)",
              borderRadius: "var(--b1-radius-lg)",
              border: "1px solid var(--b1-color-border-light)",
            }}
          >
            <Search style={{ width: 36, height: 36, color: "var(--b1-color-text-muted)", margin: "0 auto 10px", display: "block" }} />
            <strong style={{ display: "block", color: "var(--b1-color-text-main)", fontSize: 15, marginBottom: 4 }}>
              {products.length > 0 ? "No encontramos platos con este filtro" : "No tenés platos creados aún"}
            </strong>
            <span style={{ fontSize: 13, color: "var(--b1-color-text-muted)", display: "block", marginBottom: 16, maxWidth: 360, margin: "0 auto 16px" }}>
              {products.length > 0
                ? "Probá cambiando la categoría o borrando el término de búsqueda para ver todos los platos."
                : "¡Hacé clic en el botón de abajo para armar la carta digital de tu local!"}
            </span>
            {products.length > 0 ? (
              <button
                type="button"
                className="b1-btn-primary"
                style={{ width: "auto", margin: "0 auto", padding: "8px 18px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
                <span>Limpiar filtros / Ver todos</span>
              </button>
            ) : (
              <button
                type="button"
                className="b1-btn-primary"
                style={{ width: "auto", margin: "0 auto", padding: "8px 18px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={onOpenNewModal}
              >
                <Plus style={{ width: 15, height: 15 }} />
                <span>Crear Primer Plato</span>
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((p) => (
            <CartaProductCard
              key={p.id}
              product={p}
              categories={categories}
              onEdit={onEditProduct}
              onDelete={onDeleteProduct}
            />
          ))
        )}
      </main>
    </>
  );
}
