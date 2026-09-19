"use client";

import React from "react";
import { Link2, Edit2, Trash2, UtensilsCrossed } from "lucide-react";
import { Product, Category } from "@/types/carta";
import { formatMoney } from "@/types/panel";

interface CartaProductCardProps {
  product: Product;
  categories: Category[];
  onEdit: (product: Product) => void;
  onDelete: (id: number, name: string) => void;
}

export default function CartaProductCard({
  product,
  categories,
  onEdit,
  onDelete,
}: CartaProductCardProps) {
  const categoryObj = categories.find((c) => c.id === product.categoryId);
  const catLabel = categoryObj ? categoryObj.name : product.categoryId;

  return (
    <div
      className="b1-product-row-card"
      onClick={() => onEdit(product)}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px",
      }}
    >
      {/* Food Thumbnail on Left */}
      <div
        className="b1-row-media-container"
        style={{
          width: 90,
          height: 90,
          maxWidth: 90,
          borderRadius: 14,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200"}
          alt={product.name}
          className="b1-row-thumb"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200";
          }}
        />
      </div>

      {/* Info Container on Right */}
      <div className="b1-row-info" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <div className="b1-row-badge-row" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
          {product.badge ? (
            <span className="b1-item-badge">{product.badge}</span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--b1-color-text-muted)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <UtensilsCrossed style={{ width: 11, height: 11 }} />
              {catLabel}
            </span>
          )}
          {product.recipe && product.recipe.length > 0 && (
            <span style={{ fontSize: 10, background: "rgba(3, 105, 161, 0.12)", color: "#0284c7", padding: "2px 6px", borderRadius: 4, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Link2 style={{ width: 11, height: 11 }} />
              <span>{product.recipe.length} insumos</span>
            </span>
          )}
        </div>

        <h4 className="b1-row-title" style={{ fontSize: 15, fontWeight: 800, margin: 0, lineHeight: 1.25, wordBreak: "break-word" }}>
          {product.name}
        </h4>
        <p className="b1-row-desc" style={{ fontSize: 12, margin: "2px 0 6px", lineHeight: 1.35, color: "var(--b1-color-text-muted)" }}>
          {product.description || (product.ingredients && product.ingredients.length > 0 ? product.ingredients.join(", ") : "Sin descripción")}
        </p>

        <div className="b1-row-price-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: "auto", paddingTop: 4 }}>
          <span className="b1-row-price" style={{ fontSize: 16, fontWeight: 800 }}>
            ${formatMoney(product.price)}
          </span>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="b1-cat-pill"
              style={{ padding: "5px 10px", fontSize: 11, fontWeight: 700, background: "var(--b1-color-surface-subtle)", display: "inline-flex", alignItems: "center", gap: 4 }}
              onClick={() => onEdit(product)}
              title="Editar plato"
            >
              <Edit2 style={{ width: 12, height: 12 }} />
              <span>Editar</span>
            </button>

            <button
              type="button"
              className="b1-cat-pill"
              style={{ padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "var(--b1-color-danger)", borderColor: "rgba(239,68,68,0.3)", background: "var(--b1-color-danger-light)", display: "inline-flex", alignItems: "center", gap: 4 }}
              onClick={() => onDelete(product.id, product.name)}
              title="Borrar plato"
            >
              <Trash2 style={{ width: 12, height: 12 }} />
              <span>Borrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
