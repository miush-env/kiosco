"use client";

import React from "react";
import { Home, ShoppingCart, User, Sun, Moon } from "lucide-react";

interface BottomNavProps {
  isCartOpen: boolean;
  isProfileOpen: boolean;
  cartItemCount: number;
  hasCustomerProfileOrAuth: boolean;
  isAdminUser?: boolean;
  theme: "light" | "dark";
  onGoHome: () => void;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onToggleTheme: () => void;
}

export function BottomNav({
  isCartOpen,
  isProfileOpen,
  cartItemCount,
  hasCustomerProfileOrAuth,
  theme,
  onGoHome,
  onOpenCart,
  onOpenProfile,
  onToggleTheme,
}: BottomNavProps) {
  return (
    <nav className="b1-bottom-nav" aria-label="Navegación principal">
      {/* 1. Inicio */}
      <button
        type="button"
        className={`b1-bottom-nav-item ${!isCartOpen && !isProfileOpen ? "active" : ""}`}
        onClick={onGoHome}
        title="Ir a Inicio"
      >
        <div className="b1-bottom-nav-icon">
          <Home style={{ width: 24, height: 24 }} />
        </div>
        <span className="b1-bottom-nav-label">Inicio</span>
      </button>

      {/* 2. Carrito con badge */}
      <button
        type="button"
        className={`b1-bottom-nav-item ${isCartOpen ? "active" : ""}`}
        onClick={onOpenCart}
        title="Ver Carrito de Compras"
      >
        <div className="b1-bottom-nav-icon">
          <ShoppingCart style={{ width: 24, height: 24 }} />
          {cartItemCount > 0 && (
            <span className="b1-bottom-nav-cart-badge">{cartItemCount}</span>
          )}
        </div>
        <span className="b1-bottom-nav-label">Carrito</span>
      </button>

      {/* 3. Mi Cuenta */}
      <button
        type="button"
        className={`b1-bottom-nav-item ${isProfileOpen ? "active" : ""}`}
        onClick={onOpenProfile}
        title="Mi Cuenta y Datos de Entrega"
      >
        <div className="b1-bottom-nav-icon">
          <User style={{ width: 24, height: 24 }} />
          {hasCustomerProfileOrAuth && <span className="b1-bottom-nav-badge"></span>}
        </div>
        <span className="b1-bottom-nav-label">Cuenta</span>
      </button>

      {/* 4. Tema */}
      <button
        type="button"
        className="b1-bottom-nav-item"
        onClick={onToggleTheme}
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
  );
}
