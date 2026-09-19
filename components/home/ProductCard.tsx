"use client";

import React from "react";
import { Plus, Check, Star, Clock } from "lucide-react";

export interface Product {
  id: number;
  categoryId: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  badge?: string;
  rating?: string;
  prepTime?: string;
  image?: string | null;
  linkedInventoryId?: string;
  availableStock?: number;
}

interface ProductCardProps {
  product: Product;
  quickAddedId: number | null;
  onSelect: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

function formatMoney(amount: number | string): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-AR");
}

export default function ProductCard({
  product,
  quickAddedId,
  onSelect,
  onQuickAdd,
}: ProductCardProps) {
  const isOut = product.availableStock !== undefined && product.availableStock <= 0;
  const isAdded = quickAddedId === product.id;

  return (
    <div
      className={`b1-product-row-card ${isOut ? "is-out-of-stock" : ""}`}
      onClick={() => onSelect(product)}
    >
      <div className="b1-row-media-container">
        <img
          src={product.image || "/assets/images/logo.png"}
          alt={`${product.name} - Alakary`}
          loading="lazy"
          className="b1-row-thumb"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300";
          }}
        />
        {isOut && <span className="b1-img-out-badge">Agotado</span>}
        {!isOut && (
          <button
            type="button"
            style={{ borderRadius: "50%" }}
            className="b1-row-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product);
            }}
            title="Agregar al pedido"
            aria-label={`Agregar ${product.name} al pedido`}
          >
            {isAdded ? (
              <Check className="w-4 h-4 text-white stroke-[3]" />
            ) : (
              <Plus className="w-4 h-4 text-white stroke-[3]" />
            )}
          </button>
        )}
      </div>

      <div className="b1-row-info">
        <div className="b1-row-badge-row">
          {isOut ? (
            <span className="b1-item-badge out-of-stock">Agotado</span>
          ) : (
            product.badge && <span className="b1-item-badge">{product.badge}</span>
          )}
        </div>
        <h3 className="b1-row-title">{product.name}</h3>
        {product.description && <p className="b1-row-desc">{product.description}</p>}
        <div className="b1-row-price-row">
          <span className="b1-row-price">
            <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--b1-color-text-main)" }}>
              $ {formatMoney(product.price)}
            </span>
            {(product.categoryId === "empanadas" || product.name.toLowerCase().includes("empanada")) && (
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--b1-color-text-muted)", marginLeft: 4 }}>
                (x6u)
              </span>
            )}
          </span>
          {(product.categoryId === "empanadas" || product.name.toLowerCase().includes("empanada")) && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#EA580C",
                background: "#FFF7ED",
                border: "1px solid #FFEDD5",
                padding: "2px 7px",
                borderRadius: 6,
                letterSpacing: "-0.2px",
              }}
            >
              Docena $18.000
            </span>
          )}
          {product.rating && (
            <span className="b1-row-rating">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 inline mr-0.5" />
              <span>{product.rating}</span>
            </span>
          )}
          {product.prepTime && (
            <span className="b1-row-meta">
              <Clock className="w-3 h-3 text-slate-500 inline mr-0.5" />
              <span>{product.prepTime}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
