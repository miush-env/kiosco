export interface Lot {
  id: string;
  qty: number;
  expirationDate: string | null;
  addedDate: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  stock: number;
  unit?: string;
  minAlert?: number;
  icon?: string;
  barcode?: string | null;
  lots: Lot[];
  source?: "local" | "sheets";
}

export interface InventoryStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface Sale {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
  description?: string;
  source: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  source: string;
}

export interface OrderItem {
  name: string;
  quantity?: number;
  qty?: number;
  price: number;
  comment?: string;
  title?: string;
}

export interface Order {
  id: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  deliveryType: "envio" | "retiro";
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  transferRef?: string;
  receiptImage?: string;
  status: "pendiente" | "aprobado" | "rechazado" | "iniciado";
  createdAt?: string;
}

export type OrderFilter = "all" | "pendiente" | "aprobado" | "rechazado";
export type StockStatusFilter = "all" | "normal" | "low" | "out";
export type FinancePeriod = "today" | "week" | "month" | "all";

export function formatMoney(amount: number | string): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-AR");
}

export function parseOrderItems(rawItems: any): OrderItem[] {
  if (Array.isArray(rawItems)) return rawItems;
  if (typeof rawItems === "string") {
    try {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  if (rawItems && typeof rawItems === "object") {
    try {
      const vals = Object.values(rawItems);
      if (Array.isArray(vals)) return vals as OrderItem[];
    } catch {}
  }
  return [];
}
