import { NextResponse } from "next/server";
import { updateOrderStatusAsync } from "@/lib/db";
import { getRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const role = await getRole();
    if (role !== "owner" && role !== "admin") {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !["pendiente", "aprobado", "rechazado"].includes(status)) {
      return NextResponse.json({ success: false, message: "Parámetros inválidos." }, { status: 400 });
    }

    const result = await updateOrderStatusAsync(orderId, status);
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message || "Error al actualizar estado." }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: result.order });
  } catch (err: any) {
    console.error("[POST /api/orders/status error]", err.message);
    return NextResponse.json({ success: false, message: "Error interno del servidor." }, { status: 500 });
  }
}
