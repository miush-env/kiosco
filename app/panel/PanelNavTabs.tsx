"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Bell, UtensilsCrossed, Package, BarChart3 } from "lucide-react";

export type AdminTab = "orders" | "carta" | "stock" | "finance";

interface PanelNavTabsProps {
  isOwner?: boolean;
}

export default function PanelNavTabs({ isOwner = true }: PanelNavTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingCount, setPendingCount] = useState<number>(0);

  const isCarta = pathname?.startsWith("/panel/carta");
  const currentTabParam = searchParams?.get("tab");

  const activeTab: AdminTab = isCarta
    ? "carta"
    : currentTabParam === "stock"
    ? "stock"
    : currentTabParam === "finance"
    ? "finance"
    : "orders";

  // Periodically fetch pending orders count for the live badge
  useEffect(() => {
    let isMounted = true;

    const fetchPendingOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.orders)) {
          const count = data.orders.filter((o: any) => o.status === "pendiente").length;
          setPendingCount(count);
        }
      } catch (err) {
        // silent catch
      }
    };

    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const tabs: { id: AdminTab; label: string; href: string; icon: React.ElementType; badge?: number }[] = [
    {
      id: "orders",
      label: "Pedidos",
      href: "/panel?tab=orders",
      icon: Bell,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    ...(isOwner
      ? [
          {
            id: "carta" as AdminTab,
            label: "Carta",
            href: "/panel/carta",
            icon: UtensilsCrossed,
          },
        ]
      : []),
    {
      id: "stock",
      label: "Stock",
      href: "/panel?tab=stock",
      icon: Package,
    },
    {
      id: "finance",
      label: "Finanzas",
      href: "/panel?tab=finance",
      icon: BarChart3,
    },
  ];

  return (
    <nav
      aria-label="Navegación del Panel de Administración"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        background: "var(--b1-color-surface-subtle, #F1F5F9)",
        padding: "4px",
        borderRadius: "16px",
        border: "1px solid var(--b1-color-border, #E2E8F0)",
        marginBottom: "12px",
        boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.04)",
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            style={{
              flex: 1,
              padding: "8px 6px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: isActive ? 700 : 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              textDecoration: "none",
              color: isActive ? "var(--b1-color-primary, #EA580C)" : "var(--b1-color-text-muted, #64748B)",
              background: isActive ? "var(--b1-color-surface, #FFFFFF)" : "transparent",
              boxShadow: isActive ? "0 2px 6px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0,0,0,0.04)" : "none",
              border: isActive ? "1px solid var(--b1-color-border-light, rgba(0,0,0,0.05))" : "1px solid transparent",
              transition: "all 0.16s ease",
              cursor: "pointer",
            }}
          >
            <Icon
              style={{
                width: 16,
                height: 16,
                color: isActive ? "var(--b1-color-primary, #EA580C)" : "currentColor",
                flexShrink: 0,
              }}
            />
            <span style={{ whiteSpace: "nowrap" }}>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  background: isActive ? "#FEE2E2" : "#EF4444",
                  color: isActive ? "#DC2626" : "#FFFFFF",
                  fontSize: "10px",
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: "10px",
                  marginLeft: "2px",
                  lineHeight: "1.2",
                }}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
