"use client";

import React from "react";
import {
  Flame,
  Pizza,
  Sandwich,
  CupSoda,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";

export function getCategoryLucideIcon(catId: string, name?: string) {
  const lower = (catId + " " + (name || "")).toLowerCase();
  if (lower.includes("all") || lower.includes("todo")) return Flame;
  if (lower.includes("pizza")) return Pizza;
  if (lower.includes("burger") || lower.includes("hamburguesa") || lower.includes("lomo") || lower.includes("sandwich")) return Sandwich;
  if (lower.includes("empanada") || lower.includes("minuta")) return UtensilsCrossed;
  if (lower.includes("bebida") || lower.includes("gaseosa") || lower.includes("trago") || lower.includes("agua")) return CupSoda;
  if (lower.includes("especial") || lower.includes("promo")) return Sparkles;
  return UtensilsCrossed;
}

export function getCategoryCustomImage(catId: string, name?: string): string | null {
  const lower = (catId + " " + (name || "")).toLowerCase();
  if (lower.includes("pancho") || lower.includes("especial")) return "/assets/images/pancho.png";
  if (lower.includes("empanada")) return "/assets/images/empanada.png";
  if (
    lower.includes("sandwich") ||
    lower.includes("sanguche") ||
    lower.includes("burger") ||
    lower.includes("hamburguesa") ||
    lower.includes("lomo")
  ) {
    return "/assets/images/sandwich.png";
  }
  if (lower.includes("pizza") || lower.includes("calzone")) {
    return "/assets/images/porcion-de-pizza.png";
  }
  return null;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface CategoryChipsProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export default function CategoryChips({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryChipsProps) {
  // Filtrar para no duplicar el botón "Todo el Menú" con categorías como "Todos", "All", etc.
  const filteredCategories = categories.filter((cat) => {
    const id = (cat.id || "").toLowerCase().trim();
    const name = (cat.name || "").toLowerCase().trim();
    return (
      id !== "all" &&
      id !== "todos" &&
      name !== "todos" &&
      name !== "all" &&
      name !== "todo el menú" &&
      name !== "todo el menu"
    );
  });

  return (
    <div className="b1-categories-section bg-transparent px-4 max-w-md md:max-w-xl lg:max-w-2xl mx-auto my-3">
      {/* Scroll Horizontal de Chips de Categoría */}
      <div className="b1-categories-wrapper bg-transparent">
        <div className="b1-categories-scroll">
          <button
            type="button"
            className={`b1-category-pill ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => onSelectCategory("all")}
          >
            <Flame style={{ width: 16, height: 16 }} />
            <span>Todo el Menú</span>
          </button>

          {filteredCategories.map((cat) => {
            const customImg = getCategoryCustomImage(cat.id, cat.name);
            const IconComp = getCategoryLucideIcon(cat.id, cat.name);
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                className={`b1-category-pill ${isActive ? "active" : ""}`}
                onClick={() => onSelectCategory(cat.id)}
              >
                {customImg ? (
                  <img
                    src={customImg}
                    alt={cat.name}
                    width={24}
                    height={24}
                    style={{
                      width: 24,
                      height: 24,
                      objectFit: "contain",
                      display: "inline-block",
                      flexShrink: 0,
                      imageRendering: "pixelated",
                    }}
                  />
                ) : (
                  <IconComp style={{ width: 16, height: 16 }} />
                )}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
