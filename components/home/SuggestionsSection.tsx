"use client";

import React from "react";
import { Sparkles, Plus, Check, Star } from "lucide-react";
import { Product } from "./ProductCard";
import { formatMoney } from "@/lib/formatters";

export interface SuggestionsSectionProps {
  suggestions: Product[];
  searchQuery: string;
  selectedCategory: string;
  quickAddedId: number | null;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
  onViewAllSuggestions: () => void;
}

export default function SuggestionsSection({
  suggestions,
  searchQuery,
  selectedCategory,
  quickAddedId,
  onSelectProduct,
  onQuickAdd,
  onViewAllSuggestions,
}: SuggestionsSectionProps) {
  if (searchQuery || selectedCategory !== "all" || suggestions.length === 0) {
    return null;
  }

  return (
    <section id="suggestionsSection" className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-4 mb-4">
      <div className="b1-suggestions-header">
        <h2 className="b1-suggestions-title flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Sugerencias y Destacados</span>
        </h2>
        <button
          type="button"
          onClick={onViewAllSuggestions}
          className="b1-suggestions-link"
        >
          Ver todos
        </button>
      </div>

      <div className="b1-suggestions-grid">
        {suggestions.map((p) => {
          const isOut = p.availableStock !== undefined && p.availableStock <= 0;
          const isAdded = quickAddedId === p.id;
          return (
            <div
              key={p.id}
              className={`b1-suggestion-card ${isOut ? "is-out-of-stock" : ""}`}
              onClick={() => onSelectProduct(p)}
            >
              {isOut ? (
                <span className="b1-card-badge out-of-stock">Agotado</span>
              ) : (
                p.badge && <span className="b1-card-badge">{p.badge}</span>
              )}

              <div className="b1-sugg-img-wrapper">
                <img
                  src={p.image || "/assets/images/logo.png"}
                  alt={`${p.name} - Alakary`}
                  loading="lazy"
                  className="b1-sugg-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300";
                  }}
                />
              </div>

              <div className="b1-sugg-body">
                <h3 className="b1-sugg-title">{p.name}</h3>
                <div className="b1-sugg-footer">
                  <span className="b1-sugg-price">
                    $ {formatMoney(p.price)}
                  </span>
                  <div className="flex items-center gap-2">
                    {p.rating && (
                      <span className="b1-sugg-rating flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>{p.rating}</span>
                      </span>
                    )}
                    {!isOut && (
                      <button
                        type="button"
                        style={{
                          width: "32px",
                          height: "32px",
                          minWidth: "32px",
                          minHeight: "32px",
                          borderRadius: "50%",
                          border: "none",
                          padding: 0,
                          outline: "none",
                        }}
                        className="rounded-full aspect-square bg-[#10B981] text-white flex items-center justify-center shadow-xs hover:bg-[#059669] active:scale-90 transition-all shrink-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAdd(p);
                        }}
                        title="Agregar al pedido"
                        aria-label={`Agregar ${p.name} al pedido`}
                      >
                        {isAdded ? (
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        ) : (
                          <Plus className="w-4 h-4 text-white stroke-[3]" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
