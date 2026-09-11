import fs from "fs";
import path from "path";
import https from "https";
import crypto from "crypto";
import { getSql, initNeonDatabase } from "./neon";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const INVENTORY_FILE = path.join(DATA_DIR, "inventory.json");
const SALES_FILE = path.join(DATA_DIR, "sales.json");
const EXPENSES_FILE = path.join(DATA_DIR, "expenses.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

// Ensure DATA_DIR exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface StoreInfo {
  name: string;
  tagline?: string;
  address?: string;
  whatsapp?: string;
  currencySymbol?: string;
  deliveryPrice?: number;
  deliveryFree?: boolean;
}

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
  availableStock?: number | null;
}

export interface ProductsData {
  storeInfo: StoreInfo;
  categories: Category[];
  products: Product[];
}

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
  source?: "local" | "sheets" | "neon";
}

export interface InventoryStats {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface SaleItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
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
  relatedProductId?: string;
  source: string;
}

export interface Order {
  id: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  deliveryType: "envio" | "retiro";
  items: any[];
  total: number;
  paymentMethod: "efectivo" | "transferencia" | "mercadopago";
  transferRef?: string;
  receiptImage?: string;
  status: "pendiente" | "aprobado" | "rechazado" | "iniciado";
  createdAt?: string;
}

/* ── HELPER UTILITIES ────────────────────────────────────────────────────── */
export function generateId(prefix: string): string {
  return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

const ACCENT_MAP: Record<string, string> = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u", ñ: "n",
  Á: "a", É: "e", Í: "i", Ó: "o", Ú: "u", Ñ: "n",
};

export function slugify(text: string): string {
  const noAccents = String(text || "")
    .split("")
    .map((ch) => ACCENT_MAP[ch] || ch)
    .join("");
  return (
    noAccents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "producto"
  );
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseArrayField<T = any>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      if (val.trim()) {
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean) as unknown as T[];
      }
    }
  }
  if (val && typeof val === "object") {
    try {
      const values = Object.values(val);
      if (Array.isArray(values)) return values as T[];
    } catch {}
  }
  return [];
}

/* ── FALLBACK SYNCHRONOUS FILE OPERATIONS ────────────────────────────────── */
export function loadProductsFile(): ProductsData {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
      return {
        storeInfo: parsed.storeInfo || { name: "Alakary" },
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        products: Array.isArray(parsed.products) ? parsed.products : [],
      };
    }
  } catch (e: any) {
    console.error("[Products DB Error]", e.message);
  }
  return { storeInfo: { name: "Alakary" }, categories: [], products: [] };
}

export function saveProductsFile(data: ProductsData): boolean {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e: any) {
    console.error("[Products DB Save Error]", e.message);
    return false;
  }
}

export function loadInventory(): InventoryItem[] {
  try {
    if (fs.existsSync(INVENTORY_FILE)) {
      const inventory: InventoryItem[] = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
      inventory.forEach((item) => {
        if (item.barcode === undefined) item.barcode = null;
        if (!Array.isArray(item.lots)) item.lots = [];
      });
      return inventory;
    }
  } catch (e: any) {
    console.error("[Inventory DB Error]", e.message);
  }
  return [];
}

export function saveInventory(inventory: InventoryItem[]): boolean {
  try {
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(inventory, null, 2), "utf8");
    return true;
  } catch (e: any) {
    console.error("[Inventory DB Save Error]", e.message);
    return false;
  }
}

export function recalcStock(item: InventoryItem): void {
  if (item.lots && item.lots.length > 0) {
    item.stock = item.lots.reduce((sum, l) => sum + (l.qty || 0), 0);
  }
}

export function getAvailableStock(item: InventoryItem): number {
  if (item.lots && Array.isArray(item.lots) && item.lots.length > 0) {
    const sumLots = item.lots.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
    if (sumLots > 0 || !item.stock) return sumLots;
  }
  return Number(item.stock) || 0;
}

export function deductFEFO(item: InventoryItem, qty: number): void {
  const parsedQty = Math.max(0, parseFloat(String(qty)) || 0);
  if (parsedQty <= 0) return;

  if (item.lots && Array.isArray(item.lots) && item.lots.length > 0) {
    item.lots.sort((a, b) =>
      (a.expirationDate || "9999-99-99").localeCompare(b.expirationDate || "9999-99-99")
    );
    let remaining = parsedQty;
    item.lots = item.lots.filter((lot) => {
      if (remaining <= 0) return true;
      const lotQty = Number(lot.qty) || 0;
      if (lotQty <= remaining) {
        remaining -= lotQty;
        return false;
      }
      lot.qty = lotQty - remaining;
      remaining = 0;
      return true;
    });
    recalcStock(item);
  } else {
    item.stock = Math.max(0, (Number(item.stock) || 0) - parsedQty);
  }
}

export function calculateInventoryStats(inventory: InventoryItem[]): InventoryStats {
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  inventory.forEach((item) => {
    const minThreshold = item.minAlert !== undefined ? item.minAlert : 15;
    const avail = getAvailableStock(item);
    if (avail <= 0) {
      outOfStock++;
    } else if (avail < minThreshold) {
      lowStock++;
    } else {
      inStock++;
    }
  });

  return { total: inventory.length, inStock, lowStock, outOfStock };
}

/* ── CALCULATE PRODUCT MAX PORTIONS FROM INGREDIENTS BOTTLENECK ─────────── */
export function calculateProductAvailableStock(
  product: Product,
  inventory: InventoryItem[]
): number | null {
  // If product has explicit recipe with ingredients
  if (product.recipe && Array.isArray(product.recipe) && product.recipe.length > 0) {
    const invMap = new Map<string, number>();
    inventory.forEach((item) => {
      const avail = getAvailableStock(item);
      if (item.barcode) {
        invMap.set(String(item.barcode).trim(), avail);
      }
      if (item.id) {
        invMap.set(String(item.id).trim(), avail);
      }
      if (item.name) {
        invMap.set(String(item.name).trim().toLowerCase(), avail);
      }
    });

    let bottleneck = Infinity;
    for (const line of product.recipe) {
      const lineKey = String(line.barcode || "").trim();
      const lineName = String(line.name || "").trim().toLowerCase();

      let available = 0;
      if (invMap.has(lineKey)) {
        available = invMap.get(lineKey)!;
      } else if (invMap.has(lineName)) {
        available = invMap.get(lineName)!;
      } else {
        const foundItem = inventory.find(
          (i) =>
            (i.barcode && String(i.barcode).trim() === lineKey) ||
            (i.id && String(i.id).trim() === lineKey) ||
            (i.name && String(i.name).trim().toLowerCase() === lineName)
        );
        available = foundItem ? getAvailableStock(foundItem) : 0;
      }

      const lineQty = Math.max(0.0001, Number(line.qty) || 1);
      const portions = Math.floor(available / lineQty);
      if (portions < bottleneck) {
        bottleneck = portions;
      }
    }
    return bottleneck === Infinity ? 0 : Math.max(0, bottleneck);
  }

  // If product is directly linked 1:1 to an inventory item
  if (product.linkedInventoryId) {
    const item = inventory.find(
      (i) => i.id === product.linkedInventoryId || i.barcode === product.linkedInventoryId
    );
    return item ? getAvailableStock(item) : 0;
  }

  return null;
}

/* ── IN-MEMORY CACHE FOR HIGH PERFORMANCE CATALOG ────────────────────── */
interface CatalogCachePayload {
  storeInfo: StoreInfo;
  categories: Category[];
  products: (Product & { availableStock?: number })[];
}

let catalogCache: { data: CatalogCachePayload; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60s cache TTL, invalidated immediately on mutations

export function invalidateCatalogCache() {
  catalogCache = null;
}

/* ── ASYNC DATABASE OPERATIONS (Neon PostgreSQL or JSON Fallback) ───────── */
export async function getProductsDataAsync(): Promise<ProductsData> {
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      const [storeRows, catRows, prodRows] = await Promise.all([
        sql`SELECT * FROM store_info WHERE id = 'main' LIMIT 1;`,
        sql`SELECT * FROM categories ORDER BY sort_order ASC, name ASC;`,
        sql`SELECT * FROM products ORDER BY id ASC;`,
      ]);

      const storeInfo: StoreInfo = storeRows[0]
        ? {
            name: storeRows[0].name,
            tagline: storeRows[0].tagline,
            address: storeRows[0].address,
            whatsapp: storeRows[0].whatsapp,
            currencySymbol: storeRows[0].currency_symbol,
            deliveryPrice: Number(storeRows[0].delivery_price || 0),
            deliveryFree: Boolean(storeRows[0].delivery_free),
          }
        : { name: "Kiosco 24" };

      const categories: Category[] = catRows.map((r: any) => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
      }));

      const products: Product[] = prodRows.map((r: any) => ({
        id: Number(r.id),
        categoryId: r.category_id,
        name: r.name,
        description: r.description || "",
        ingredients: parseArrayField<string>(r.ingredients),
        price: Number(r.price),
        badge: r.badge || "",
        rating: r.rating || "5.0",
        prepTime: r.prep_time || "15-20 min",
        image: r.image || null,
        recipe: parseArrayField<RecipeLine>(r.recipe),
        linkedInventoryId: r.linked_inventory_id || undefined,
      }));

      return { storeInfo, categories, products };
    } catch (e: any) {
      console.error("[Neon Products Fetch Error]", e.message);
    }
  }
  return loadProductsFile();
}

export async function getPublicCatalogAsync(): Promise<CatalogCachePayload> {
  const now = Date.now();
  if (catalogCache && now - catalogCache.timestamp < CACHE_TTL_MS) {
    return catalogCache.data;
  }

  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      const [storeRows, catRows, prodRows, invRows] = await Promise.all([
        sql`SELECT * FROM store_info WHERE id = 'main' LIMIT 1;`,
        sql`SELECT * FROM categories ORDER BY sort_order ASC, name ASC;`,
        sql`SELECT * FROM products ORDER BY id ASC;`,
        sql`SELECT * FROM inventory ORDER BY name ASC;`,
      ]);

      const storeInfo: StoreInfo = storeRows[0]
        ? {
            name: storeRows[0].name,
            tagline: storeRows[0].tagline,
            address: storeRows[0].address,
            whatsapp: storeRows[0].whatsapp,
            currencySymbol: storeRows[0].currency_symbol,
            deliveryPrice: Number(storeRows[0].delivery_price || 0),
            deliveryFree: Boolean(storeRows[0].delivery_free),
          }
        : { name: "Alakary" };

      const categories: Category[] = catRows.map((r: any) => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
      }));

      const inventory: InventoryItem[] = invRows.map((r: any) => ({
        id: r.id,
        barcode: r.barcode || null,
        name: r.name,
        category: r.category || "General",
        unit: r.unit || "unidades",
        stock: Number(r.stock || 0),
        minAlert: Number(r.min_alert !== undefined ? r.min_alert : 15),
        icon: r.icon || "📦",
        lots: parseArrayField<Lot>(r.lots),
        source: "neon" as const,
      }));

      const products = prodRows.map((r: any) => {
        const prod: Product = {
          id: Number(r.id),
          categoryId: r.category_id,
          name: r.name,
          description: r.description || "",
          ingredients: parseArrayField<string>(r.ingredients),
          price: Number(r.price),
          badge: r.badge || "",
          rating: r.rating || "5.0",
          prepTime: r.prep_time || "15-20 min",
          image: r.image || null,
          recipe: parseArrayField<RecipeLine>(r.recipe),
          linkedInventoryId: r.linked_inventory_id || undefined,
        };
        const stock = calculateProductAvailableStock(prod, inventory);
        return {
          ...prod,
          availableStock: stock !== null ? stock : undefined,
        };
      });

      const payload: CatalogCachePayload = { storeInfo, categories, products };
      catalogCache = { data: payload, timestamp: now };
      return payload;
    } catch (e: any) {
      console.error("[getPublicCatalogAsync Error]", e.message);
    }
  }

  // Fallback to local files
  const data = loadProductsFile();
  const inventory = loadInventory();
  const enrichedProducts = (data.products || []).map((p) => {
    const stock = calculateProductAvailableStock(p, inventory);
    return {
      ...p,
      availableStock: stock !== null ? stock : undefined,
    };
  });

  const payload: CatalogCachePayload = { ...data, products: enrichedProducts };
  catalogCache = { data: payload, timestamp: now };
  return payload;
}

export async function saveProductsDataAsync(data: ProductsData): Promise<boolean> {
  invalidateCatalogCache();
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      // Update store info
      await sql`
        INSERT INTO store_info (id, name, tagline, address, whatsapp, currency_symbol, delivery_price, delivery_free, updated_at)
        VALUES (
          'main',
          ${data.storeInfo.name},
          ${data.storeInfo.tagline || ""},
          ${data.storeInfo.address || ""},
          ${data.storeInfo.whatsapp || ""},
          ${data.storeInfo.currencySymbol || "$"},
          ${data.storeInfo.deliveryPrice || 0},
          ${data.storeInfo.deliveryFree || false},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          tagline = EXCLUDED.tagline,
          address = EXCLUDED.address,
          whatsapp = EXCLUDED.whatsapp,
          currency_symbol = EXCLUDED.currency_symbol,
          delivery_price = EXCLUDED.delivery_price,
          delivery_free = EXCLUDED.delivery_free,
          updated_at = NOW();
      `;
      return true;
    } catch (e: any) {
      console.error("[Neon Products Save Error]", e.message);
    }
  }
  return saveProductsFile(data);
}

export async function getInventoryAsync(): Promise<InventoryItem[]> {
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      const rows = await sql`SELECT * FROM inventory ORDER BY name ASC;`;
      return rows.map((r: any) => ({
        id: r.id,
        barcode: r.barcode || null,
        name: r.name,
        category: r.category || "General",
        unit: r.unit || "unidades",
        stock: Number(r.stock || 0),
        minAlert: Number(r.min_alert !== undefined ? r.min_alert : 15),
        icon: r.icon || "📦",
        lots: parseArrayField<Lot>(r.lots),
        source: "neon" as const,
      }));
    } catch (e: any) {
      console.error("[Neon Inventory Fetch Error]", e.message);
    }
  }
  return loadInventory();
}

export async function saveInventoryAsync(inventory: InventoryItem[]): Promise<boolean> {
  invalidateCatalogCache();
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      for (const item of inventory) {
        await sql`
          INSERT INTO inventory (id, barcode, name, category, unit, stock, min_alert, icon, lots)
          VALUES (
            ${item.id},
            ${item.barcode || null},
            ${item.name},
            ${item.category || "General"},
            ${item.unit || "unidades"},
            ${item.stock || 0},
            ${item.minAlert !== undefined ? item.minAlert : 15},
            ${item.icon || "📦"},
            ${JSON.stringify(item.lots || [])}::jsonb
          )
          ON CONFLICT (id) DO UPDATE SET
            barcode = EXCLUDED.barcode,
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            unit = EXCLUDED.unit,
            stock = EXCLUDED.stock,
            min_alert = EXCLUDED.min_alert,
            icon = EXCLUDED.icon,
            lots = EXCLUDED.lots;
        `;
      }
      return true;
    } catch (e: any) {
      console.error("[Neon Inventory Save Error]", e.message);
    }
  }
  return saveInventory(inventory);
}

export async function getMergedInventory(): Promise<{ inventory: InventoryItem[]; stats: InventoryStats }> {
  const inventory = await getInventoryAsync();
  const stats = calculateInventoryStats(inventory);
  return { inventory, stats };
}

/* ── ASYNC PRODUCTS CRUD (POSTGRESQL & CACHE INVALIDATION) ───────────────── */
export async function saveProductAsync(
  product: Product,
  newCategory?: { id: string; name: string; icon?: string }
): Promise<{ success: boolean; product: Product; categories: Category[] }> {
  invalidateCatalogCache();
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      if (newCategory) {
        await sql`
          INSERT INTO categories (id, name, icon, sort_order)
          VALUES (${newCategory.id}, ${newCategory.name}, ${newCategory.icon || "🍽️"}, 99)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            icon = EXCLUDED.icon;
        `;
      }

      const prodId = BigInt(product.id);
      await sql`
        INSERT INTO products (
          id, category_id, name, description, ingredients, price, badge, rating, prep_time, image, recipe, linked_inventory_id
        ) VALUES (
          ${prodId},
          ${product.categoryId},
          ${product.name},
          ${product.description || ""},
          ${JSON.stringify(product.ingredients || [])}::jsonb,
          ${product.price || 0},
          ${product.badge || ""},
          ${product.rating || "5.0"},
          ${product.prepTime || ""},
          ${product.image || null},
          ${JSON.stringify(product.recipe || [])}::jsonb,
          ${product.linkedInventoryId || null}
        )
        ON CONFLICT (id) DO UPDATE SET
          category_id = EXCLUDED.category_id,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          ingredients = EXCLUDED.ingredients,
          price = EXCLUDED.price,
          badge = EXCLUDED.badge,
          rating = EXCLUDED.rating,
          prep_time = EXCLUDED.prep_time,
          image = EXCLUDED.image,
          recipe = EXCLUDED.recipe,
          linked_inventory_id = EXCLUDED.linked_inventory_id;
      `;

      const catRows = await sql`SELECT * FROM categories ORDER BY sort_order ASC, name ASC;`;
      const categories: Category[] = catRows.map((r: any) => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
      }));

      return { success: true, product, categories };
    } catch (e: any) {
      console.error("[saveProductAsync Error]", e.message);
      throw e;
    }
  }

  // Local fallback
  const localData = loadProductsFile();
  if (!Array.isArray(localData.categories)) localData.categories = [];
  if (!Array.isArray(localData.products)) localData.products = [];

  if (newCategory && !localData.categories.some((c) => c.id === newCategory.id)) {
    localData.categories.push(newCategory);
  }

  const existingIdx = localData.products.findIndex((p) => Number(p.id) === Number(product.id));
  if (existingIdx >= 0) {
    localData.products[existingIdx] = product;
  } else {
    localData.products.push(product);
  }
  saveProductsFile(localData);
  return { success: true, product, categories: localData.categories };
}

export async function deleteProductAsync(id: number): Promise<boolean> {
  invalidateCatalogCache();
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      const prodId = BigInt(id);
      await sql`DELETE FROM products WHERE id = ${prodId};`;
      return true;
    } catch (e: any) {
      console.error("[deleteProductAsync Error]", e.message);
      throw e;
    }
  }

  const localData = loadProductsFile();
  localData.products = (localData.products || []).filter((p) => Number(p.id) !== Number(id));
  saveProductsFile(localData);
  return true;
}

export async function createInventoryItemAsync(
  item: InventoryItem,
  cost?: number
): Promise<{ success: boolean; item: InventoryItem }> {
  invalidateCatalogCache();
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      await sql`
        INSERT INTO inventory (id, barcode, name, category, unit, stock, min_alert, icon, lots)
        VALUES (
          ${item.id},
          ${item.barcode || null},
          ${item.name},
          ${item.category || "General"},
          ${item.unit || "unidades"},
          ${item.stock || 0},
          ${item.minAlert !== undefined ? item.minAlert : 15},
          ${item.icon || "📦"},
          ${JSON.stringify(item.lots || [])}::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
          barcode = EXCLUDED.barcode,
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          unit = EXCLUDED.unit,
          stock = EXCLUDED.stock,
          min_alert = EXCLUDED.min_alert,
          icon = EXCLUDED.icon,
          lots = EXCLUDED.lots;
      `;

      if (cost && cost > 0) {
        await createExpenseAsync({
          id: generateId("exp"),
          date: todayISO(),
          description: "Compra de stock: " + item.name,
          amount: cost,
          category: "stock",
          relatedProductId: item.id,
          source: "stock_entry",
        });
      }

      return { success: true, item };
    } catch (e: any) {
      console.error("[createInventoryItemAsync Error]", e.message);
      throw e;
    }
  }

  const inventory = loadInventory();
  inventory.push(item);
  saveInventory(inventory);
  if (cost && cost > 0) {
    const expenses = loadExpenses();
    expenses.push({
      id: generateId("exp"),
      date: todayISO(),
      description: "Compra de stock: " + item.name,
      amount: cost,
      category: "stock",
      relatedProductId: item.id,
      source: "stock_entry",
    });
    saveExpenses(expenses);
  }
  return { success: true, item };
}

export async function addLotAsync(
  id: string,
  qty: number,
  expirationDate?: string | null,
  cost?: number,
  itemName?: string
): Promise<{ success: boolean; item: InventoryItem; stats: InventoryStats }> {
  invalidateCatalogCache();
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      const rows = await sql`SELECT * FROM inventory WHERE id = ${id} OR barcode = ${id} LIMIT 1;`;
      if (rows.length === 0) {
        throw new Error("Producto no encontrado en inventario.");
      }
      const r = rows[0];
      const item: InventoryItem = {
        id: r.id,
        barcode: r.barcode || null,
        name: r.name,
        category: r.category || "General",
        unit: r.unit || "unidades",
        stock: Number(r.stock || 0),
        minAlert: Number(r.min_alert !== undefined ? r.min_alert : 15),
        icon: r.icon || "📦",
        lots: Array.isArray(r.lots) ? r.lots : [],
      };

      item.lots.push({
        id: generateId("lot"),
        qty: qty,
        expirationDate: expirationDate || null,
        addedDate: todayISO(),
      });
      recalcStock(item);

      await sql`
        UPDATE inventory SET
          stock = ${item.stock},
          lots = ${JSON.stringify(item.lots)}::jsonb
        WHERE id = ${item.id};
      `;

      if (cost && cost > 0) {
        await createExpenseAsync({
          id: generateId("exp"),
          date: todayISO(),
          description: "Compra de stock: " + (itemName || item.name),
          amount: cost,
          category: "stock",
          relatedProductId: item.id,
          source: "stock_entry",
        });
      }

      const merged = await getMergedInventory();
      const updated = merged.inventory.find((i) => i.id === item.id) || item;
      return { success: true, item: updated, stats: merged.stats };
    } catch (e: any) {
      console.error("[addLotAsync Error]", e.message);
      throw e;
    }
  }

  const inventory = loadInventory();
  const item = inventory.find((i) => i.id === id);
  if (!item) throw new Error("Producto no encontrado.");

  item.lots.push({
    id: generateId("lot"),
    qty,
    expirationDate: expirationDate || null,
    addedDate: todayISO(),
  });
  recalcStock(item);
  saveInventory(inventory);
  if (cost && cost > 0) {
    const expenses = loadExpenses();
    expenses.push({
      id: generateId("exp"),
      date: todayISO(),
      description: "Compra de stock: " + item.name,
      amount: cost,
      category: "stock",
      relatedProductId: item.id,
      source: "stock_entry",
    });
    saveExpenses(expenses);
  }
  const stats = calculateInventoryStats(inventory);
  return { success: true, item, stats };
}

export async function deleteInventoryItemAsync(id: string): Promise<boolean> {
  invalidateCatalogCache();
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      await sql`DELETE FROM inventory WHERE id = ${id} OR barcode = ${id};`;
      return true;
    } catch (e: any) {
      console.error("[deleteInventoryItemAsync Error]", e.message);
      throw e;
    }
  }
  const inventory = loadInventory().filter((i) => i.id !== id && i.barcode !== id);
  saveInventory(inventory);
  return true;
}

export async function adjustInventoryStockFast(
  id: string,
  delta?: number,
  setStock?: number
): Promise<{ success: boolean; item?: InventoryItem; stats: InventoryStats }> {
  invalidateCatalogCache();
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      const rows = await sql`SELECT * FROM inventory WHERE id = ${id} OR barcode = ${id} LIMIT 1;`;
      if (rows.length > 0) {
        const r = rows[0];
        const currentStock = Number(r.stock || 0);
        let newStock = currentStock;
        if (typeof setStock === "number") {
          newStock = Math.max(0, setStock);
        } else if (typeof delta === "number") {
          newStock = Math.max(0, currentStock + delta);
        }

        const lots = parseArrayField<Lot>(r.lots);
        if (lots.length > 0) {
          if (newStock < currentStock) {
            deductFEFO({ ...r, stock: currentStock, lots } as any, currentStock - newStock);
          } else if (newStock > currentStock) {
            lots[0].qty = (Number(lots[0].qty) || 0) + (newStock - currentStock);
          }
        }

        await sql`
          UPDATE inventory
          SET stock = ${newStock},
              lots = ${JSON.stringify(lots)}::jsonb
          WHERE id = ${r.id};
        `;

        const item: InventoryItem = {
          id: r.id,
          barcode: r.barcode || null,
          name: r.name,
          category: r.category || "General",
          unit: r.unit || "unidades",
          stock: newStock,
          minAlert: Number(r.min_alert !== undefined ? r.min_alert : 15),
          icon: r.icon || "📦",
          lots: lots,
          source: "neon",
        };

        const allRows = await sql`SELECT stock, min_alert FROM inventory;`;
        let inStock = 0, lowStock = 0, outOfStock = 0;
        allRows.forEach((row: any) => {
          const s = Number(row.stock || 0);
          const m = Number(row.min_alert !== undefined ? row.min_alert : 15);
          if (s <= 0) outOfStock++;
          else if (s < m) lowStock++;
          else inStock++;
        });

        return {
          success: true,
          item,
          stats: { total: allRows.length, inStock, lowStock, outOfStock },
        };
      }
    } catch (e: any) {
      console.error("[adjustInventoryStockFast Error]", e.message);
    }
  }

  // Local fallback
  const inventory = loadInventory();
  const item = inventory.find((i) => i.id === id || i.barcode === id);
  if (item) {
    if (typeof setStock === "number") {
      item.stock = Math.max(0, setStock);
    } else if (typeof delta === "number") {
      item.stock = Math.max(0, (Number(item.stock) || 0) + delta);
    }
    saveInventory(inventory);
    return { success: true, item, stats: calculateInventoryStats(inventory) };
  }
  return { success: false, stats: calculateInventoryStats(inventory) };
}

/* ── SALES & EXPENSES OPERATIONS ─────────────────────────────────────────── */
export function loadSales(): Sale[] {
  try {
    if (fs.existsSync(SALES_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SALES_FILE, "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e: any) {
    console.error("[Sales DB Error]", e.message);
  }
  return [];
}

export async function getSalesAsync(): Promise<Sale[]> {
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      const rows = await sql`SELECT * FROM sales ORDER BY date DESC, created_at DESC LIMIT 500;`;
      return rows.map((r: any) => ({
        id: r.id,
        date: r.date,
        items: parseArrayField<SaleItem>(r.items),
        total: Number(r.total),
        paymentMethod: r.payment_method,
        description: r.description || undefined,
        source: r.source || "pos",
      }));
    } catch (e: any) {
      console.error("[Neon Sales Fetch Error]", e.message);
    }
  }
  return loadSales();
}

export async function createSaleAsync(sale: Sale): Promise<boolean> {
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      await sql`
        INSERT INTO sales (id, date, items, total, payment_method, description, source)
        VALUES (
          ${sale.id},
          ${sale.date},
          ${JSON.stringify(sale.items || [])}::jsonb,
          ${sale.total},
          ${sale.paymentMethod || "efectivo"},
          ${sale.description || null},
          ${sale.source || "pos"}
        );
      `;
      return true;
    } catch (e: any) {
      console.error("[Neon Sale Create Error]", e.message);
    }
  }
  const sales = loadSales();
  sales.unshift(sale);
  saveSales(sales);
  return true;
}

export function saveSales(sales: Sale[]): boolean {
  try {
    fs.writeFileSync(SALES_FILE, JSON.stringify(sales, null, 2), "utf8");
    return true;
  } catch (e: any) {
    console.error("[Sales DB Save Error]", e.message);
    return false;
  }
}

export function loadExpenses(): Expense[] {
  try {
    if (fs.existsSync(EXPENSES_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(EXPENSES_FILE, "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e: any) {
    console.error("[Expenses DB Error]", e.message);
  }
  return [];
}

export async function getExpensesAsync(): Promise<Expense[]> {
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      const rows = await sql`SELECT * FROM expenses ORDER BY date DESC, created_at DESC LIMIT 500;`;
      return rows.map((r: any) => ({
        id: r.id,
        date: r.date,
        description: r.description,
        amount: Number(r.amount),
        category: r.category,
        relatedProductId: undefined,
        source: r.source || "manual",
      }));
    } catch (e: any) {
      console.error("[Neon Expenses Fetch Error]", e.message);
    }
  }
  return loadExpenses();
}

export async function createExpenseAsync(expense: Expense): Promise<boolean> {
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      await sql`
        INSERT INTO expenses (id, date, description, amount, category, source)
        VALUES (
          ${expense.id},
          ${expense.date},
          ${expense.description},
          ${expense.amount},
          ${expense.category || "general"},
          ${expense.source || "manual"}
        );
      `;
      return true;
    } catch (e: any) {
      console.error("[Neon Expense Create Error]", e.message);
    }
  }
  const expenses = loadExpenses();
  expenses.unshift(expense);
  saveExpenses(expenses);
  return true;
}

export function saveExpenses(expenses: Expense[]): boolean {
  try {
    fs.writeFileSync(EXPENSES_FILE, JSON.stringify(expenses, null, 2), "utf8");
    return true;
  } catch (e: any) {
    console.error("[Expenses DB Save Error]", e.message);
    return false;
  }
}

/* ── STOCK DEDUCTION ON CONFIRMED ORDER ─────────────────────────────────── */
export async function deductIngredientsForOrder(items: any[]): Promise<void> {
  if (!items || !Array.isArray(items) || items.length === 0) return;

  const productsData = await getProductsDataAsync();
  const inventory = await getInventoryAsync();

  const inventoryMap = new Map<string, InventoryItem>();
  inventory.forEach((item) => {
    inventoryMap.set(String(item.id).trim(), item);
    if (item.barcode) inventoryMap.set(String(item.barcode).trim(), item);
    if (item.name) inventoryMap.set(String(item.name).trim().toLowerCase(), item);
  });

  for (const orderItem of items) {
    const qty = Math.max(1, parseInt(orderItem.quantity || 1, 10));

    // 1. Direct linked item
    if (orderItem.linkedInventoryId) {
      const key = String(orderItem.linkedInventoryId).trim();
      const invItem = inventoryMap.get(key) || inventoryMap.get(key.toLowerCase());
      if (invItem) {
        deductFEFO(invItem, qty);
      }
      continue;
    }

    // 2. Dish recipe
    const product = productsData.products.find(
      (p) =>
        Number(p.id) === Number(orderItem.id) ||
        (p.name && orderItem.name && p.name.trim().toLowerCase() === String(orderItem.name).trim().toLowerCase())
    );

    if (product?.recipe && product.recipe.length > 0) {
      for (const line of product.recipe) {
        const lineKey = String(line.barcode || "").trim();
        const lineName = String(line.name || "").trim().toLowerCase();
        let invItem = inventoryMap.get(lineKey) || inventoryMap.get(lineName);
        if (!invItem) {
          invItem = inventory.find(
            (i) =>
              (i.barcode && String(i.barcode).trim() === lineKey) ||
              (i.id && String(i.id).trim() === lineKey) ||
              (i.name && String(i.name).trim().toLowerCase() === lineName)
          );
        }
        if (invItem) {
          const usedQty = Math.max(0.0001, Number(line.qty) || 1) * qty;
          deductFEFO(invItem, usedQty);
        }
      }
      continue;
    }
  }

  // Save updated inventory back to DB / local
  const uniqueItems = Array.from(new Set(inventory.concat(Array.from(inventoryMap.values()))));
  await saveInventoryAsync(uniqueItems);
  invalidateCatalogCache();
  console.log("[Stock Auto-Deduct] Descuento de stock completado e invalidado cache.");
}

/* ── STOCK RESTORATION ON REJECTED ORDER ─────────────────────────────────── */
export async function restoreIngredientsForOrder(items: any[]): Promise<void> {
  if (!items || !Array.isArray(items) || items.length === 0) return;

  const productsData = await getProductsDataAsync();
  const inventory = await getInventoryAsync();

  const inventoryMap = new Map<string, InventoryItem>();
  inventory.forEach((item) => {
    inventoryMap.set(String(item.id).trim(), item);
    if (item.barcode) inventoryMap.set(String(item.barcode).trim(), item);
    if (item.name) inventoryMap.set(String(item.name).trim().toLowerCase(), item);
  });

  for (const orderItem of items) {
    const qty = Math.max(1, parseInt(orderItem.quantity || 1, 10));

    // 1. Direct linked item
    if (orderItem.linkedInventoryId) {
      const key = String(orderItem.linkedInventoryId).trim();
      const invItem = inventoryMap.get(key) || inventoryMap.get(key.toLowerCase());
      if (invItem) {
        invItem.stock = (Number(invItem.stock) || 0) + qty;
        if (invItem.lots && invItem.lots.length > 0) {
          invItem.lots[0].qty = (Number(invItem.lots[0].qty) || 0) + qty;
          recalcStock(invItem);
        }
      }
      continue;
    }

    // 2. Dish recipe
    const product = productsData.products.find(
      (p) =>
        Number(p.id) === Number(orderItem.id) ||
        (p.name && orderItem.name && p.name.trim().toLowerCase() === String(orderItem.name).trim().toLowerCase())
    );

    if (product?.recipe && product.recipe.length > 0) {
      for (const line of product.recipe) {
        const lineKey = String(line.barcode || "").trim();
        const lineName = String(line.name || "").trim().toLowerCase();
        let invItem = inventoryMap.get(lineKey) || inventoryMap.get(lineName);
        if (!invItem) {
          invItem = inventory.find(
            (i) =>
              (i.barcode && String(i.barcode).trim() === lineKey) ||
              (i.id && String(i.id).trim() === lineKey) ||
              (i.name && String(i.name).trim().toLowerCase() === lineName)
          );
        }
        if (invItem) {
          const addQty = Math.max(0.0001, Number(line.qty) || 1) * qty;
          invItem.stock = (Number(invItem.stock) || 0) + addQty;
          if (invItem.lots && invItem.lots.length > 0) {
            invItem.lots[0].qty = (Number(invItem.lots[0].qty) || 0) + addQty;
            recalcStock(invItem);
          }
        }
      }
      continue;
    }
  }

  const uniqueItems = Array.from(new Set(inventory.concat(Array.from(inventoryMap.values()))));
  await saveInventoryAsync(uniqueItems);
  invalidateCatalogCache();
  console.log("[Stock Auto-Restore] Stock reestablecido por orden rechazada.");
}

/* ── MERCADO PAGO INTEGRATION ────────────────────────────────────────────── */
export function createMercadoPagoPreference(preferenceData: any, token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(preferenceData);
    const options = {
      hostname: "api.mercadopago.com",
      port: 443,
      path: "/checkout/preferences",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

/* ── VALIDATE ORDER STOCK BEFORE CONFIRMATION ──────────────────────────── */
export async function validateOrderStock(items: any[]): Promise<{ ok: boolean; message?: string }> {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { ok: true };
  }

  const productsData = await getProductsDataAsync();
  const inventory = await getInventoryAsync();

  const inventoryStockMap = new Map<string, { name: string; available: number }>();
  inventory.forEach((item) => {
    const avail = getAvailableStock(item);
    inventoryStockMap.set(String(item.id).trim(), { name: item.name, available: avail });
    if (item.barcode) {
      inventoryStockMap.set(String(item.barcode).trim(), { name: item.name, available: avail });
    }
    if (item.name) {
      inventoryStockMap.set(String(item.name).trim().toLowerCase(), { name: item.name, available: avail });
    }
  });

  const requiredStock = new Map<string, { name: string; required: number }>();

  for (const orderItem of items) {
    const qty = Math.max(1, parseInt(orderItem.quantity || 1, 10));

    if (orderItem.linkedInventoryId) {
      const key = String(orderItem.linkedInventoryId).trim();
      const current = requiredStock.get(key)?.required || 0;
      requiredStock.set(key, { name: orderItem.name || "producto", required: current + qty });
      continue;
    }

    const product = productsData.products.find(
      (p) =>
        Number(p.id) === Number(orderItem.id) ||
        (p.name && orderItem.name && p.name.trim().toLowerCase() === String(orderItem.name).trim().toLowerCase())
    );

    if (product?.recipe && product.recipe.length > 0) {
      for (const line of product.recipe) {
        const lineKey = String(line.barcode || line.name || "").trim();
        const current = requiredStock.get(lineKey)?.required || 0;
        const lineQty = Math.max(0.0001, Number(line.qty) || 1);
        requiredStock.set(lineKey, { name: line.name || lineKey, required: current + lineQty * qty });
      }
    }
  }

  for (const [key, reqObj] of requiredStock.entries()) {
    const keyLower = key.toLowerCase();
    let inv = inventoryStockMap.get(key) || inventoryStockMap.get(keyLower);
    if (!inv) {
      const foundItem = inventory.find(
        (i) =>
          (i.barcode && String(i.barcode).trim() === key) ||
          (i.id && String(i.id).trim() === key) ||
          (i.name && String(i.name).trim().toLowerCase() === keyLower)
      );
      if (foundItem) {
        inv = { name: foundItem.name, available: getAvailableStock(foundItem) };
      }
    }

    const available = inv ? inv.available : 0;
    if (reqObj.required > available) {
      const ingredientName = inv ? inv.name : reqObj.name;
      return {
        ok: false,
        message: `Stock insuficiente de "${ingredientName}". Disponible: ${available}, requerido: ${reqObj.required}.`,
      };
    }
  }

  return { ok: true };
}

/* ── SHEETS INTEGRATION (Compatibility Layer) ────────────────────────────── */
export async function sheetsListProducts(): Promise<any[]> {
  const inventory = await getInventoryAsync();
  return inventory.map((i) => ({
    barcode: i.barcode || i.id,
    name: i.name,
    category: i.category || "General",
    unit: i.unit || "unidades",
    stock: i.stock,
    minAlert: i.minAlert || 15,
    expirationDate: i.lots?.[0]?.expirationDate || null,
  }));
}

export async function sheetsLookupBarcode(barcode: string): Promise<{ success: boolean; found: boolean; product?: any; message?: string }> {
  const inventory = await getInventoryAsync();
  const item = inventory.find((i) => i.barcode === barcode || i.id === barcode);
  if (item) {
    return {
      success: true,
      found: true,
      product: {
        barcode: item.barcode || item.id,
        name: item.name,
        category: item.category || "General",
        unit: item.unit || "unidades",
        stock: item.stock,
        minAlert: item.minAlert || 15,
        expirationDate: item.lots?.[0]?.expirationDate || null,
      },
    };
  }
  return { success: true, found: false };
}

export async function sheetsAdjustStock(
  barcode: string,
  qty: number,
  expirationDate?: string | null
): Promise<{ success: boolean; product?: any; message?: string }> {
  const inventory = await getInventoryAsync();
  let item = inventory.find((i) => i.barcode === barcode || i.id === barcode);
  if (!item) {
    return { success: false, message: "Insumo no encontrado." };
  }

  if (qty > 0) {
    item.lots.push({
      id: generateId("lot"),
      qty,
      expirationDate: expirationDate || null,
      addedDate: todayISO(),
    });
    recalcStock(item);
  } else if (qty < 0) {
    deductFEFO(item, Math.abs(qty));
  }

  await saveInventoryAsync(inventory);
  return { success: true, product: item };
}

export async function sheetsCreateProduct(data: {
  barcode: string;
  name: string;
  category?: string;
  unit?: string;
  stock?: number;
  expirationDate?: string | null;
  minAlert?: number;
}): Promise<{ success: boolean; product?: any; message?: string }> {
  const inventory = await getInventoryAsync();
  const existing = inventory.find((i) => i.barcode === data.barcode);
  if (existing) {
    return { success: false, message: "El código de barras ya existe en el inventario." };
  }

  const item: InventoryItem = {
    id: "prod_" + slugify(data.name) + "_" + Date.now().toString(36),
    barcode: data.barcode,
    name: data.name,
    category: data.category || "General",
    unit: data.unit || "unidades",
    stock: 0,
    minAlert: data.minAlert || 15,
    icon: "📦",
    lots: [],
    source: "neon",
  };

  if (data.stock && data.stock > 0) {
    item.lots.push({
      id: generateId("lot"),
      qty: data.stock,
      expirationDate: data.expirationDate || null,
      addedDate: todayISO(),
    });
    recalcStock(item);
  }

  inventory.push(item);
  await saveInventoryAsync(inventory);
  return { success: true, product: item };
}

export async function sheetsListCategories(): Promise<string[]> {
  const inventory = await getInventoryAsync();
  const cats = new Set<string>();
  inventory.forEach((i) => {
    if (i.category && i.category.trim()) cats.add(i.category.trim());
  });
  return Array.from(cats);
}

/* ── ORDERS & TRANSFER VERIFICATION ─────────────────────────────────────── */
export function loadOrders(): Order[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e: any) {
    console.error("[Orders DB Error]", e.message);
  }
  return [];
}

export function saveOrders(orders: Order[]): boolean {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
    return true;
  } catch (e: any) {
    console.error("[Orders DB Save Error]", e.message);
    return false;
  }
}

export async function getOrdersAsync(): Promise<Order[]> {
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      const rows = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 300;`;
      return rows.map((r: any) => ({
        id: r.id,
        date: r.date,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        customerAddress: r.customer_address || undefined,
        deliveryType: r.delivery_type || "envio",
        items: Array.isArray(r.items) ? r.items : [],
        total: Number(r.total),
        paymentMethod: r.payment_method,
        transferRef: r.transfer_ref || undefined,
        receiptImage: r.receipt_image || undefined,
        status: r.status || "pendiente",
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      }));
    } catch (e: any) {
      console.error("[Neon Orders Fetch Error]", e.message);
    }
  }
  return loadOrders();
}

export async function getOrderByIdAsync(orderId: string): Promise<Order | null> {
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      const rows = await sql`SELECT * FROM orders WHERE id = ${orderId} LIMIT 1;`;
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          date: r.date,
          customerName: r.customer_name,
          customerPhone: r.customer_phone,
          customerAddress: r.customer_address || undefined,
          deliveryType: r.delivery_type || "envio",
          items: Array.isArray(r.items) ? r.items : [],
          total: Number(r.total),
          paymentMethod: r.payment_method,
          transferRef: r.transfer_ref || undefined,
          receiptImage: r.receipt_image || undefined,
          status: r.status || "pendiente",
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
        };
      }
    } catch (e: any) {
      console.error("[Neon Order Fetch By Id Error]", e.message);
    }
  }
  const orders = loadOrders();
  return orders.find((o) => o.id === orderId) || null;
}

export async function createOrderAsync(order: Order): Promise<boolean> {
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      await sql`
        INSERT INTO orders (
          id, date, customer_name, customer_phone, customer_address, delivery_type,
          items, total, payment_method, transfer_ref, receipt_image, status, created_at
        ) VALUES (
          ${order.id},
          ${order.date},
          ${order.customerName},
          ${order.customerPhone},
          ${order.customerAddress || null},
          ${order.deliveryType || "envio"},
          ${JSON.stringify(order.items || [])}::jsonb,
          ${order.total},
          ${order.paymentMethod},
          ${order.transferRef || null},
          ${order.receiptImage || null},
          ${order.status || "pendiente"},
          NOW()
        );
      `;
      // Dispatch background webhook if configured
      dispatchOrderWebhook(order).catch((err) =>
        console.warn("[Webhook Dispatch Warning]", err.message)
      );
      return true;
    } catch (e: any) {
      console.error("[Neon Order Create Error]", e.message);
    }
  }
  const orders = loadOrders();
  orders.unshift(order);
  saveOrders(orders);
  dispatchOrderWebhook(order).catch(() => {});
  return true;
}

export async function updateOrderStatusAsync(
  orderId: string,
  newStatus: "pendiente" | "aprobado" | "rechazado" | "iniciado"
): Promise<{ success: boolean; order?: Order; message?: string }> {
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      const updated = await sql`
        UPDATE orders
        SET status = ${newStatus}
        WHERE id = ${orderId}
        RETURNING *;
      `;
      if (updated.length > 0) {
        const r = updated[0];
        const order: Order = {
          id: r.id,
          date: r.date,
          customerName: r.customer_name,
          customerPhone: r.customer_phone,
          customerAddress: r.customer_address || undefined,
          deliveryType: r.delivery_type || "envio",
          items: Array.isArray(r.items) ? r.items : [],
          total: Number(r.total),
          paymentMethod: r.payment_method,
          transferRef: r.transfer_ref || undefined,
          receiptImage: r.receipt_image || undefined,
          status: r.status,
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined,
        };

        // If newly approved, register in sales
        if (newStatus === "aprobado") {
          await createSaleAsync({
            id: generateId("sale"),
            date: todayISO(),
            items: order.items.map((i: any) => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
            })),
            total: order.total,
            paymentMethod: order.paymentMethod,
            description: `Pedido ${order.id} - ${order.customerName} (${order.transferRef ? "Ref: " + order.transferRef : "Aprobado"})`,
            source: "pedido_online",
          });
        } else if (newStatus === "rechazado") {
          // If rejected/canceled, restore stock back to inventory
          await restoreIngredientsForOrder(order.items);
        }

        return { success: true, order };
      }
    } catch (e: any) {
      console.error("[Neon Order Status Update Error]", e.message);
      return { success: false, message: e.message };
    }
  }

  const orders = loadOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = newStatus;
    saveOrders(orders);
    if (newStatus === "aprobado") {
      await createSaleAsync({
        id: generateId("sale"),
        date: todayISO(),
        items: orders[idx].items.map((i: any) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        total: orders[idx].total,
        paymentMethod: orders[idx].paymentMethod,
        description: `Pedido ${orders[idx].id} - ${orders[idx].customerName}`,
        source: "pedido_online",
      });
    } else if (newStatus === "rechazado") {
      await restoreIngredientsForOrder(orders[idx].items);
    }
    return { success: true, order: orders[idx] };
  }
  return { success: false, message: "Pedido no encontrado" };
}

export async function clearOrdersAsync(): Promise<boolean> {
  const sql = getSql();
  if (sql) {
    try {
      await initNeonDatabase();
      await sql`DELETE FROM orders;`;
      return true;
    } catch (e: any) {
      console.error("[Neon Clear Orders Error]", e.message);
    }
  }
  saveOrders([]);
  return true;
}


/* ── DISPATCH ASYNC WEBHOOK TO AUTOMATION AGENT (n8n, Make, etc.) ───────── */
export async function dispatchOrderWebhook(order: Order): Promise<boolean> {
  const webhookUrl = process.env.TRANSFER_WEBHOOK_URL || process.env.ORDERS_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const secret = process.env.TRANSFER_WEBHOOK_SECRET || "kiosco-secret";
  const payload = JSON.stringify({
    event: "order.created",
    timestamp: new Date().toISOString(),
    order: {
      id: order.id,
      date: order.date,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress || null,
      },
      deliveryType: order.deliveryType,
      items: order.items,
      total: order.total,
      paymentMethod: order.paymentMethod,
      transferRef: order.transferRef || null,
      status: order.status,
    },
  });

  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Signature-SHA256": signature,
        "X-Event-Type": "order.created",
        Authorization: `Bearer ${secret}`,
      },
      body: payload,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch (err: any) {
    console.warn("[Webhook Dispatch Failed Non-Blocking]", err.message);
    return false;
  }
}
