"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, ChevronDown, Bell, ShoppingCart, Search, X } from "lucide-react";

export interface HeaderProps {
  /** Dirección corta a mostrar (ej. "Paderewski 3666") */
  currentShortAddress?: string;
  /** Cantidad total de productos en el carrito para el badge */
  cartItemCount?: number;
  /** Texto del buscador controlado desde el exterior */
  searchQuery?: string;
  /** Placeholder personalizado del input */
  placeholder?: string;
  /** Callback al hacer click en el selector de dirección */
  onOpenAddressModal?: () => void;
  /** Cantidad de notificaciones para el badge en la campana */
  notificationsCount?: number;
  /** Callback al hacer click en la campana de notificaciones */
  onOpenNotifications?: () => void;
  /** Callback al hacer click en el botón del carrito */
  onOpenCart?: () => void;
  /** Callback al cambiar el texto del buscador */
  onSearchChange?: (value: string) => void;
  /** Callback al ejecutar la búsqueda o presionar Enter */
  onSearchSubmit?: (value: string) => void;
  /** Callback al limpiar el texto de búsqueda */
  onClearSearch?: () => void;
}

export default function PedidosYaHeader({
  currentShortAddress = "Paderewski 3666",
  cartItemCount = 0,
  notificationsCount,
  searchQuery = "",
  placeholder = "Buscar por plato o descripción...",
  onOpenAddressModal,
  onOpenNotifications,
  onOpenCart,
  onSearchChange,
  onSearchSubmit,
  onClearSearch,
}: HeaderProps) {
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  useEffect(() => {
    const updateNotifsCount = () => {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("kiosco_customer_notifications");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              const unread = parsed.filter((n: any) => n && n.read !== true).length;
              setUnreadNotifsCount(unread);
              return;
            }
          }
          setUnreadNotifsCount(0);
        } catch (e) {
          setUnreadNotifsCount(0);
        }
      }
    };

    updateNotifsCount();
    window.addEventListener("kiosco_customer_notifications_updated", updateNotifsCount);
    window.addEventListener("storage", updateNotifsCount);
    return () => {
      window.removeEventListener("kiosco_customer_notifications_updated", updateNotifsCount);
      window.removeEventListener("storage", updateNotifsCount);
    };
  }, []);

  const activeNotifsCount = typeof notificationsCount === "number" ? notificationsCount : unreadNotifsCount;
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Control de scroll y gestos touch con bloqueo de transición (Anti-reflow loop)
  const isTouchActive = useRef(false);
  const touchStartY = useRef(0);
  const touchAnchorY = useRef(0);
  const lastScrollY = useRef(0);
  const accumulatedDelta = useRef(0);
  const transitionEndTimestamp = useRef(0);

  useEffect(() => {
    // 1. Manejo de eventos Touch físicos (pantalla móvil)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        isTouchActive.current = true;
        touchStartY.current = e.touches[0].clientY;
        touchAnchorY.current = e.touches[0].clientY;
        accumulatedDelta.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      const currentY = window.scrollY;
      const clientY = e.touches[0].clientY;
      const touchDelta = clientY - touchAnchorY.current;
      const now = Date.now();

      setIsScrolled(currentY > 20);

      // En el tope de la pantalla o con búsqueda activa, siempre visible
      if (currentY <= 30 || isFocused || (searchQuery && searchQuery.trim().length > 0)) {
        setIsSearchVisible(true);
        touchAnchorY.current = clientY;
        return;
      }

      // Si la animación de colapso/expansión está en curso, absorber movimiento sin alternar
      if (now < transitionEndTimestamp.current) {
        touchAnchorY.current = clientY;
        return;
      }

      // Deslizó el dedo hacia arriba > 40px (scroll hacia abajo) -> Ocultar buscador
      if (touchDelta < -40 && currentY > 70) {
        setIsSearchVisible((prev) => {
          if (prev) {
            transitionEndTimestamp.current = Date.now() + 300;
            return false;
          }
          return prev;
        });
        touchAnchorY.current = clientY;
      }
      // Deslizó el dedo hacia abajo > 30px (scroll hacia arriba) -> Mostrar buscador
      else if (touchDelta > 30) {
        setIsSearchVisible((prev) => {
          if (!prev) {
            transitionEndTimestamp.current = Date.now() + 500;
            return true;
          }
          return prev;
        });
        touchAnchorY.current = clientY;
      }
    };

    const handleTouchEnd = () => {
      isTouchActive.current = false;
      accumulatedDelta.current = 0;
      lastScrollY.current = Math.max(0, window.scrollY);
    };

    // 2. Manejo de scroll estándar (desktop, inercia de scroll post-touch)
    let ticking = false;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const now = Date.now();

      setIsScrolled(currentY > 20);

      // Siempre visible en la parte superior, o con foco / búsqueda activa
      if (currentY <= 30 || isFocused || (searchQuery && searchQuery.trim().length > 0)) {
        setIsSearchVisible(true);
        accumulatedDelta.current = 0;
        lastScrollY.current = Math.max(0, currentY);
        return;
      }

      // Durante la transición CSS del header o mientras el dedo esté en la pantalla, absorber el reflow
      if (now < transitionEndTimestamp.current || isTouchActive.current) {
        lastScrollY.current = Math.max(0, currentY);
        accumulatedDelta.current = 0;
        return;
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const delta = currentY - lastScrollY.current;

          if ((delta > 0 && accumulatedDelta.current < 0) || (delta < 0 && accumulatedDelta.current > 0)) {
            accumulatedDelta.current = delta;
          } else {
            accumulatedDelta.current += delta;
          }

          if (accumulatedDelta.current > 45 && currentY > 70) {
            setIsSearchVisible((prev) => {
              if (prev) {
                transitionEndTimestamp.current = Date.now() + 300;
                return false;
              }
              return prev;
            });
            accumulatedDelta.current = 0;
          } else if (accumulatedDelta.current < -30) {
            setIsSearchVisible((prev) => {
              if (!prev) {
                transitionEndTimestamp.current = Date.now() + 500;
                return true;
              }
              return prev;
            });
            accumulatedDelta.current = 0;
          }

          lastScrollY.current = Math.max(0, currentY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isFocused, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full text-white transition-all duration-300 overflow-hidden ${
        isScrolled
          ? "bg-[#C83014] shadow-md rounded-b-[20px] sm:rounded-b-[24px]"
          : "bg-[#DF381A] rounded-b-none"
      }`}
    >
      <div className="mx-auto max-w-md md:max-w-xl lg:max-w-2xl px-4 pt-3 pb-1">
        
        {/* ── TOP BAR: Dirección limpia a la izquierda & Accesos rápidos a la derecha ── */}
        <div className="flex items-center justify-between gap-3 h-10">
          
          {/* Selector de Dirección Clickable directo (Icono + Texto + Flecha) */}
          <button
            type="button"
            onClick={onOpenAddressModal}
            className="flex items-center gap-1.5 max-w-[70%] py-1 active:scale-95 transition-all text-left text-white focus:outline-none group"
            title="Cambiar dirección de entrega"
            aria-label="Seleccionar dirección de entrega"
          >
            <MapPin className="w-4 h-4 text-white shrink-0" />
            <span className="text-sm sm:text-base font-bold text-white truncate tracking-tight group-hover:underline decoration-white/60">
              {currentShortAddress}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-white/80 shrink-0 stroke-[2.5]" />
          </button>

          {/* Accesos Rápidos: Notificaciones y Carrito */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Notificaciones */}
            <button
              type="button"
              onClick={onOpenNotifications}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/15 active:scale-90 transition-all relative focus:outline-none cursor-pointer"
              title="Avisos y Novedades"
              aria-label="Ver avisos y notificaciones"
            >
              <Bell className="w-5 h-5 text-white stroke-[2.2]" />
              {activeNotifsCount > 0 && (
                <>
                  <span
                    style={{ borderRadius: "9999px" }}
                    className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-amber-400 animate-ping opacity-60 pointer-events-none"
                  />
                  <span
                    style={{ borderRadius: "9999px" }}
                    className="absolute -top-0.5 -right-0.5 bg-amber-400 text-slate-950 font-black text-[10px] min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm border-2 border-[#DF381A] animate-in zoom-in-75"
                  >
                    {activeNotifsCount > 99 ? "99+" : activeNotifsCount}
                  </span>
                </>
              )}
            </button>

            {/* Carrito de Compras con Badge */}
            <button
              type="button"
              onClick={onOpenCart}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/15 active:scale-90 transition-all relative focus:outline-none"
              title="Carrito de Compras"
              aria-label="Abrir carrito de compras"
            >
              <ShoppingCart className="w-5 h-5 text-white stroke-[2.2]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-white text-[#DF381A] font-black text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-sm animate-in zoom-in-75">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* ── BUSCADOR INTEGRADO (Píldora Blanca con Animación Sincronizada y Opacidad Suave) ── */}
        <div
          className={`overflow-hidden transition-all ${
            isSearchVisible
              ? "max-h-16 pb-2.5 pt-1.5 duration-500 ease-out"
              : "max-h-0 pb-0 pt-0 pointer-events-none duration-250 ease-in-out"
          }`}
        >
          <form
            onSubmit={handleSubmit}
            className={`relative w-full transition-all ease-out ${
              isSearchVisible
                ? "opacity-100 translate-y-0 scale-100 duration-450 delay-100"
                : "opacity-0 -translate-y-1 scale-95 duration-200 delay-0 pointer-events-none"
            }`}
          >
            <div className="flex items-center bg-white rounded-full shadow-xs pl-4 pr-1.5 py-1.5 gap-2 border border-transparent focus-within:ring-2 focus-within:ring-white/40 transition-all">
              
              {/* Input Transparente */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-0"
              />

              {/* Botón Limpiar (X) si hay texto escrito */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    if (onClearSearch) onClearSearch();
                    if (onSearchChange) onSearchChange("");
                  }}
                  className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors mr-1"
                  title="Borrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Botón Circular Lupa en tono de marca */}
              <button
                type="submit"
                style={{ borderRadius: "50%" }}
                className="w-8 h-8 sm:w-9 sm:h-9 aspect-square rounded-full bg-[#C83014] text-white flex items-center justify-center shadow-xs hover:bg-[#B91C1C] active:scale-95 transition-all shrink-0 focus:outline-none"
                title="Buscar"
                aria-label="Ejecutar búsqueda"
              >
                <Search className="w-4 h-4 text-white stroke-[2.5]" />
              </button>

            </div>
          </form>
        </div>

      </div>
    </header>
  );
}
