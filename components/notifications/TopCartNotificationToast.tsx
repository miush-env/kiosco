"use client";

import React, { useEffect, useState, useRef } from "react";
import { Check, ShoppingCart } from "lucide-react";

export interface CartNotificationData {
  id: number;
  productName: string;
  message?: string;
}

interface TopCartNotificationToastProps {
  notification: CartNotificationData | null;
  onDismiss: () => void;
  onOpenCart?: () => void;
}

export default function TopCartNotificationToast({
  notification,
  onDismiss,
  onOpenCart,
}: TopCartNotificationToastProps) {
  const [visible, setVisible] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const startXRef = useRef(0);
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const hasMovedRef = useRef(false);

  // Iniciar temporizador de auto-cierre a los 3.2s
  const resetTimer = () => {
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    autoDismissTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, 3200);
  };

  useEffect(() => {
    if (notification) {
      setVisible(true);
      setDragOffset(0);
      setIsDragging(false);
      setIsDismissing(false);
      hasMovedRef.current = false;
      resetTimer();

      return () => {
        if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
      };
    } else {
      setVisible(false);
    }
  }, [notification]);

  const handleDismiss = (direction: "left" | "right" | "fade" = "fade") => {
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    setIsDismissing(true);
    if (direction === "left") {
      setDragOffset(-320);
    } else if (direction === "right") {
      setDragOffset(320);
    }
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 220);
  };

  // ── Manejo de gestos táctiles (Touch en celulares) ──
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    setIsDragging(true);
    hasMovedRef.current = false;
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !e.touches || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    if (Math.abs(deltaX) > 6) {
      hasMovedRef.current = true;
    }
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Umbral de descarte: si deslizó más de 65px hacia cualquier lado, eliminar aviso
    if (Math.abs(dragOffset) > 65) {
      handleDismiss(dragOffset > 0 ? "right" : "left");
    } else {
      // Si no superó el umbral, rebota suavemente a su posición original
      setDragOffset(0);
      resetTimer();
    }
  };

  // ── Manejo de arrastre con mouse (Click & Drag en Desktop) ──
  const handleMouseDown = (e: React.MouseEvent) => {
    // Solo clic izquierdo
    if (e.button !== 0) return;
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    setIsDragging(true);
    hasMovedRef.current = false;
    startXRef.current = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      if (Math.abs(deltaX) > 6) {
        hasMovedRef.current = true;
      }
      setDragOffset(deltaX);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setIsDragging(false);

      const finalDeltaX = upEvent.clientX - startXRef.current;
      if (Math.abs(finalDeltaX) > 65) {
        handleDismiss(finalDeltaX > 0 ? "right" : "left");
      } else {
        setDragOffset(0);
        resetTimer();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (!notification || !visible) return null;

  // Opacidad dinámica mientras se arrastra hacia los lados
  const dragOpacity = isDismissing
    ? 0
    : Math.max(0.1, 1 - Math.abs(dragOffset) / 220);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3.5 left-1/2 -translate-x-1/2 z-[1300] w-[96%] max-w-[460px] pointer-events-auto select-none"
    >
      <div
        ref={toastRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          borderRadius: "9999px",
          transform: `translateX(${dragOffset}px)`,
          opacity: dragOpacity,
          transition: isDragging ? "none" : "transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.2s ease-out",
          cursor: isDragging ? "grabbing" : "grab",
          minHeight: "66px",
          boxSizing: "border-box",
        }}
        className="bg-white text-slate-900 border border-slate-200/90 shadow-[0_16px_44px_rgba(0,0,0,0.18)] px-4 py-2 flex items-center justify-between gap-3 ring-1 ring-black/5 active:cursor-grabbing"
      >
        {/* Lado Izquierdo: Icono Verde de Check (ancho fijo para equilibrio simétrico) */}
        <div
          style={{ width: 72, display: "flex", alignItems: "center", justifyContent: "flex-start", flexShrink: 0 }}
          className="pointer-events-none"
        >
          <div
            style={{ borderRadius: "9999px", width: 38, height: 38 }}
            className="bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs"
          >
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
        </div>

        {/* Centro: Texto 100% centrado con tipografía más grande y legible */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: 0,
            padding: "0 6px",
          }}
          className="pointer-events-none"
        >
          <span
            style={{
              margin: 0,
              padding: 0,
              lineHeight: 1.15,
              textAlign: "center",
              display: "block",
            }}
            className="text-[13px] sm:text-[14px] font-black uppercase tracking-wider text-emerald-600"
          >
            ¡Agregado al carrito!
          </span>
          <div
            style={{
              margin: 0,
              marginTop: 2,
              padding: 0,
              lineHeight: 1.2,
              textAlign: "center",
              width: "100%",
            }}
            className="text-[15px] sm:text-[17px] font-black text-slate-900 truncate"
          >
            {notification.productName}
          </div>
        </div>

        {/* Lado Derecho: Botón Ver (con border radius pill asegurado y ancho simétrico) */}
        <div
          style={{ width: 72, display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}
        >
          {onOpenCart && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hasMovedRef.current) return;
                handleDismiss("fade");
                onOpenCart();
              }}
              style={{
                borderRadius: "9999px",
                margin: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                height: "40px",
              }}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm sm:text-[15px] font-black px-4 transition-all shrink-0 shadow-xs cursor-pointer select-none"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span style={{ margin: 0, padding: 0, lineHeight: 1 }} className="font-black">Ver</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
