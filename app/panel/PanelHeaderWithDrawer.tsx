"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Home, ShoppingCart, User, Sun, Moon } from "lucide-react";

interface PanelHeaderWithDrawerProps {
  role?: string;
}

export default function PanelHeaderWithDrawer({ role = "owner" }: PanelHeaderWithDrawerProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cartItemCount, setCartItemCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("kiosco_theme") as "light" | "dark" | null;
    const current = saved || (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    setTheme(current);
    document.documentElement.setAttribute("data-theme", current);
    document.documentElement.classList.toggle("dark", current === "dark");

    try {
      const savedCart = localStorage.getItem("kiosco_cart_v1");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          const count = parsed.reduce((acc, it) => acc + (it.quantity || 1), 0);
          setCartItemCount(count);
        }
      }
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("kiosco_theme", next);
  };

  const handleBack = () => {
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/";
      }
    }
  };

  return (
    <>
      {/* ── TOPBAR ──────────────────────────────────────────────────────────── */}
      <header className="b1-topbar">
        <Link href="/" className="b1-topbar-brand">
          <img
            src="/assets/images/logo.png"
            alt="Alakary Logo"
            className="b1-topbar-logo"
          />
          <div className="b1-topbar-info">
            <h1>Alakary</h1>
            <div className="b1-status-pill">
              <span className="b1-status-dot"></span>
              <span>{role === "owner" ? "Panel Dueño" : "Panel Admin"}</span>
            </div>
          </div>
        </Link>
      </header>

      {/* ── PERMANENT FLOATING BACK BUTTON ──────────────────────────────────── */}
      <button
        type="button"
        className="b1-floating-back-btn"
        onClick={handleBack}
        title="Volver hacia atrás"
        aria-label="Volver atrás"
      >
        <ArrowLeft style={{ width: 22, height: 22 }} />
      </button>

      {/* ── EXACT SAME BOTTOM NAVIGATION BAR AS HOME PAGE ─────────────────── */}
      <nav className="b1-bottom-nav" aria-label="Navegación principal">
        {/* 1. Inicio */}
        <Link
          href="/"
          className="b1-bottom-nav-item"
          title="Ir a Inicio"
        >
          <div className="b1-bottom-nav-icon">
            <Home style={{ width: 24, height: 24 }} />
          </div>
          <span className="b1-bottom-nav-label">Inicio</span>
        </Link>

        {/* 2. Carrito con badge */}
        <Link
          href="/"
          className="b1-bottom-nav-item"
          title="Ver Carrito de Compras"
        >
          <div className="b1-bottom-nav-icon">
            <ShoppingCart style={{ width: 24, height: 24 }} />
            {cartItemCount > 0 && (
              <span className="b1-bottom-nav-cart-badge">{cartItemCount}</span>
            )}
          </div>
          <span className="b1-bottom-nav-label">Carrito</span>
        </Link>

        {/* 3. Mi Cuenta */}
        <Link
          href="/"
          className="b1-bottom-nav-item"
          title="Mi Cuenta"
        >
          <div className="b1-bottom-nav-icon">
            <User style={{ width: 24, height: 24 }} />
          </div>
          <span className="b1-bottom-nav-label">Cuenta</span>
        </Link>

        {/* 4. Tema */}
        <button
          type="button"
          className="b1-bottom-nav-item"
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          <div className="b1-bottom-nav-icon">
            {theme === "dark" ? (
              <Sun style={{ width: 24, height: 24, color: "#FBBF24" }} />
            ) : (
              <Moon style={{ width: 24, height: 24 }} />
            )}
          </div>
          <span className="b1-bottom-nav-label">Tema</span>
        </button>
      </nav>
    </>
  );
}

