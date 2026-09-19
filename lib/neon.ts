import postgres from "postgres";
import {
  ProductsData,
  InventoryItem,
  Sale,
  Expense,
  loadProductsFile,
  loadInventory,
} from "./db";

let sqlInstance: any = null;

export function getDbUrl(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    null
  );
}

export function getSql() {
  const url = getDbUrl();
  if (!url) return null;
  if (!sqlInstance) {
    sqlInstance = postgres(url, {
      ssl: { rejectUnauthorized: false },
      max: 10,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
    });
  }
  return sqlInstance;
}

let isInitialized = false;

export async function initNeonDatabase(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  if (isInitialized) return true;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS store_info (
        id TEXT PRIMARY KEY DEFAULT 'main',
        name TEXT NOT NULL DEFAULT 'Alakary',
        tagline TEXT,
        address TEXT,
        whatsapp TEXT,
        currency_symbol TEXT DEFAULT '$',
        delivery_price NUMERIC DEFAULT 0,
        delivery_free BOOLEAN DEFAULT false,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        sort_order INT DEFAULT 0
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id BIGINT PRIMARY KEY,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        ingredients JSONB DEFAULT '[]'::jsonb,
        price NUMERIC NOT NULL DEFAULT 0,
        badge TEXT DEFAULT '',
        rating TEXT DEFAULT '5.0',
        prep_time TEXT DEFAULT '15-20 min',
        image TEXT,
        recipe JSONB DEFAULT '[]'::jsonb,
        linked_inventory_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    try {
      await sql`ALTER TABLE products ALTER COLUMN id TYPE BIGINT;`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS recipe JSONB DEFAULT '[]'::jsonb;`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]'::jsonb;`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS linked_inventory_id TEXT;`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS prep_time TEXT DEFAULT '15-20 min';`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS rating TEXT DEFAULT '5.0';`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT '';`;
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT;`;
    } catch (e: any) {
      console.warn("[Postgres products ALTER warning]", e?.message);
    }

    await sql`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        barcode TEXT UNIQUE,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        unit TEXT DEFAULT 'unidades',
        stock NUMERIC DEFAULT 0,
        min_alert NUMERIC DEFAULT 15,
        icon TEXT DEFAULT '📦',
        lots JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    try {
      await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS barcode TEXT;`;
      await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS lots JSONB DEFAULT '[]'::jsonb;`;
      await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS min_alert NUMERIC DEFAULT 15;`;
      await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unidades';`;
      await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📦';`;
    } catch (e: any) {
      console.warn("[Postgres inventory ALTER warning]", e?.message);
    }

    await sql`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        items JSONB DEFAULT '[]'::jsonb,
        total NUMERIC NOT NULL DEFAULT 0,
        payment_method TEXT DEFAULT 'efectivo',
        description TEXT,
        source TEXT DEFAULT 'pos',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC NOT NULL DEFAULT 0,
        category TEXT DEFAULT 'general',
        source TEXT DEFAULT 'manual',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_address TEXT,
        delivery_type TEXT DEFAULT 'envio',
        items JSONB DEFAULT '[]'::jsonb,
        total NUMERIC NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL,
        transfer_ref TEXT,
        receipt_image TEXT,
        status TEXT NOT NULL DEFAULT 'pendiente',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_image TEXT;`;
    } catch (e) {}

    // Ensure main store info row exists without forcing mock products
    const existingStore = await sql`SELECT id FROM store_info WHERE id = 'main' LIMIT 1;`;
    if (existingStore.length === 0) {
      await sql`
        INSERT INTO store_info (id, name, tagline, address, whatsapp, currency_symbol, delivery_price, delivery_free)
        VALUES (
          'main',
          'Alakary',
          'Menú Digital & Pedidos Online',
          'Paderewski 3666',
          '+5491172570867',
          '$',
          1800,
          false
        ) ON CONFLICT (id) DO NOTHING;
      `;
    }

    isInitialized = true;
    console.log("[Supabase / Postgres DB] Schema verified successfully.");
    return true;
  } catch (err: any) {
    console.error("[Postgres DB Init Error]", err.message);
    return false;
  }
}
