"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PanelNavTabs({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();
  const isCarta = pathname?.startsWith("/panel/carta");

  return (
    <div style={{ display: "flex", gap: 8, paddingBottom: 12 }}>
      <Link
        href="/panel"
        className={`b1-category-pill ${!isCarta ? "active" : ""}`}
        style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
      >
        <span className="b1-category-icon">📦</span>
        <span>Stock & Finanzas</span>
      </Link>

      {isOwner && (
        <Link
          href="/panel/carta"
          className={`b1-category-pill ${isCarta ? "active" : ""}`}
          style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
        >
          <span className="b1-category-icon">👑</span>
          <span>Gestión Carta</span>
        </Link>
      )}
    </div>
  );
}
