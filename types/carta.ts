import {
  Flame,
  Pizza,
  Sandwich,
  CupSoda,
  UtensilsCrossed,
  Sparkles,
  LucideIcon,
} from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface RecipeLine {
  barcode: string;
  name: string;
  qty: number;
  unit?: string;
}

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
  recipe?: RecipeLine[];
}

export interface StockOption {
  barcode: string;
  name: string;
  category?: string;
  unit?: string;
  stock: number;
}

export function getCategoryLucideIcon(catId: string, name?: string): LucideIcon {
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

