"use client";

import React from "react";
import { Bike, CheckCircle2, X, MapPin } from "lucide-react";
import { ActiveDeliveryOrder } from "@/hooks/useCustomerOrderTracker";

interface DeliveryNotificationToastProps {
  order: ActiveDeliveryOrder | null;
  onDismiss: () => void;
}

export default function DeliveryNotificationToast({
  order,
  onDismiss,
}: DeliveryNotificationToastProps) {
  if (!order) return null;

  const shortId = order.id ? order.id.slice(-6).toUpperCase() : "";

  return (
    <div
      role="alert"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[1040] animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
          boxShadow: "0 12px 36px rgba(6, 78, 59, 0.45), 0 0 0 1px rgba(52, 211, 153, 0.3)",
        }}
        className="text-white p-4 rounded-2xl border border-emerald-400/40 relative overflow-hidden"
      >
        {/* Glow de fondo */}
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          {/* Icono de Repartidor con pulso */}
          <div className="w-12 h-12 rounded-xl bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center shrink-0 text-emerald-300 shadow-xs relative">
            <Bike className="w-6 h-6 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#064e3b] rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#064e3b] rounded-full" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Pedido Aceptado #{shortId}
              </span>
            </div>

            <h4 className="text-base font-black text-white mt-1 leading-tight tracking-tight">
              El delivery está yendo a la dirección indicada con tu pedido
            </h4>

            <p className="text-xs text-emerald-100/90 mt-1 leading-snug">
              Tu pago fue validado y estamos preparando la entrega para:
            </p>

            {order.customerAddress && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-white bg-black/25 px-2.5 py-1 rounded-lg border border-emerald-500/20 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="truncate">{order.customerAddress}</span>
              </div>
            )}
          </div>

          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar notificación"
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Botón de acción */}
        <div className="mt-3 pt-2.5 border-t border-emerald-500/30 flex items-center justify-between gap-2">
          <span className="text-[11px] text-emerald-200/80 font-medium">
            ¡Preparate para recibirlo!
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="px-3.5 py-1 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
}
