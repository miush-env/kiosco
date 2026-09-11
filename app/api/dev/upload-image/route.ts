import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isOwner } from "@/lib/roles";

export async function POST(req: Request) {
  const allowed = await isOwner();
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: "Acceso exclusivo para el rol Owner." },
      { status: 403 }
    );
  }

  try {
    const { filename, dataBase64 } = await req.json();
    if (!dataBase64) {
      return NextResponse.json(
        { success: false, message: "Falta la imagen." },
        { status: 400 }
      );
    }

    const ext = path.extname(filename || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const outName =
      "prod_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8) +
      safeExt;
    const outDir = path.join(process.cwd(), "public", "assets", "images", "products");

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const base64Data = dataBase64.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(path.join(outDir, outName), Buffer.from(base64Data, "base64"));

    return NextResponse.json({
      success: true,
      url: "/assets/images/products/" + outName,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 });
  }
}
