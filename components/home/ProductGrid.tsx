"use client";

import React from "react";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard, { Product } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  searchQuery: string;
  selectedCategoryName: string;
  currentPage: number;
  totalPages: number;
  quickAddedId: number | null;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
  onPageChange: (page: number) => void;
}

export default function ProductGrid({
  products,
  loading,
  searchQuery,
  selectedCategoryName,
  currentPage,
  totalPages,
  quickAddedId,
  onSelectProduct,
  onQuickAdd,
  onPageChange,
}: ProductGridProps) {
  return (
    <section className="b1-carta-container relative overflow-hidden max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-4 pb-28" id="cartaSectionContainer">
      {/* Fondo Decorativo Pizza Mozzarella Sin Fondo (Alto 100% de la sección, Ancho 35%) */}
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 bottom-0 h-full w-[35%] pointer-events-none select-none z-0 overflow-hidden flex items-center justify-end"
      >
        <img
          src="/assets/images/products/pizza-mozzarella-nobg.png"
          alt=""
          className="h-full w-full object-cover object-left opacity-35 dark:opacity-25 filter drop-shadow-lg"
        />
      </div>

      <div className="relative z-10">
        <div className="b1-section-header" id="allProductsSectionHeader">
          <h2 className="b1-section-title">
            {searchQuery
              ? `Resultados para "${searchQuery}"`
              : selectedCategoryName || "Nuestra Carta"}
          </h2>
        </div>

        <main className="b1-products-list" id="dynamicProductsContainer">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--b1-color-text-muted)" }}>
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <span>Cargando platos...</span>
            </div>
          ) : products.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                background: "var(--b1-color-surface)",
                borderRadius: "var(--b1-radius-lg)",
                border: "1px solid var(--b1-color-border)",
              }}
            >
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-2 stroke-[1.75]" />
              <strong style={{ display: "block", color: "var(--b1-color-text-main)", marginBottom: 4 }}>
                No se encontraron platos
              </strong>
              <span style={{ fontSize: 13, color: "var(--b1-color-text-muted)" }}>
                Probá buscando con otro plato o ingrediente.
              </span>
            </div>
          ) : (
            products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                quickAddedId={quickAddedId}
                onSelect={onSelectProduct}
                onQuickAdd={onQuickAdd}
              />
            ))
          )}
        </main>

        {/* Paginación */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              padding: "20px 16px 10px",
            }}
          >
            <button
              type="button"
              className="b1-pagination-btn"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4 inline" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                className={`b1-pagination-btn ${currentPage === pg ? "active" : ""}`}
                onClick={() => onPageChange(pg)}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              className="b1-pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4 inline" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
