import { NextResponse } from "next/server";
import { getSalesAsync, createSaleAsync, generateId, todayISO, Sale } from "@/lib/db";
import { isAdminOrOwner } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  const sales = await getSalesAsync();
  return NextResponse.json({ success: true, sales });
}

export async function POST(req: Request) {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const amount = parseFloat(data.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Monto inválido." },
        { status: 400 }
      );
    }

    const sale: Sale = {
      id: generateId("sale"),
      date: todayISO(),
      items: [],
      total: amount,
      paymentMethod: data.paymentMethod || "mostrador",
      description: data.description || "Venta de mostrador",
      source: "manual",
    };
    await createSaleAsync(sale);

    return NextResponse.json({ success: true, sale });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

