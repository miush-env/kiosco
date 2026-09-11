import { NextResponse } from "next/server";
import { getExpensesAsync, createExpenseAsync, generateId, todayISO, Expense } from "@/lib/db";
import { isAdminOrOwner } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  const expenses = await getExpensesAsync();
  return NextResponse.json({ success: true, expenses });
}

export async function POST(req: Request) {
  const allowed = await isAdminOrOwner();
  if (!allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const amount = parseFloat(data.amount);
    const description = (data.description || "").trim();
    if (!amount || amount <= 0 || !description) {
      return NextResponse.json(
        { success: false, message: "Descripción y monto son obligatorios." },
        { status: 400 }
      );
    }

    const expense: Expense = {
      id: generateId("exp"),
      date: todayISO(),
      description: description,
      amount: amount,
      category: data.category || "general",
      source: "manual",
    };
    await createExpenseAsync(expense);

    return NextResponse.json({ success: true, expense });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}

