import { NextResponse } from "next/server";
import { getPublicCatalogAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await getPublicCatalogAsync();

    return NextResponse.json(catalog, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    });
  } catch (err: any) {
    console.error("[GET /api/products error]", err.message);
    return NextResponse.json({ error: "Error al cargar productos" }, { status: 500 });
  }
}
