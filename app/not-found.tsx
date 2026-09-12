"use client";

import React from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  ArrowLeft,
  Home,
  MessageCircle,
  Pizza,
  Sparkles,
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Navbar Minimal */}
      <header className="w-full max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-slate-900 font-black text-lg hover:opacity-85 transition-opacity"
        >
          <img
            src="/assets/images/logo.png"
            alt="Alakary Logo"
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
          />
          <span>Alakary</span>
        </Link>

        <Link
          href="/"
          className="text-xs font-bold text-slate-600 bg-white border border-slate-200/90 px-3.5 py-1.5 rounded-full hover:bg-slate-100 transition-colors shadow-2xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a la carta</span>
        </Link>
      </header>

      {/* Main 404 Hero Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-orange-100 rounded-full blur-2xl opacity-70 pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-100 rounded-full blur-2xl opacity-70 pointer-events-none" />

          {/* Food Icon 404 Graphic */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#064e3b] to-[#047857] text-white flex items-center justify-center shadow-lg shadow-emerald-950/15 rotate-[-3deg] hover:rotate-0 transition-transform">
              <UtensilsCrossed className="w-12 h-12 text-emerald-300 stroke-[2]" />
            </div>

            {/* Small floating pizza badge */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-amber-50 border-2 border-white shadow-md flex items-center justify-center text-orange-500 rotate-12 animate-bounce">
              <Pizza className="w-5 h-5" />
            </div>
          </div>

          {/* 404 Badge */}
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 mb-3 tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>ERROR 404</span>
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">
            ¡Ups! Este plato no está en la carta
          </h1>

          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
            La página o sección que estás buscando no existe, fue movida o el enlace es incorrecto.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <Link
              href="/"
              className="w-full py-3.5 px-5 text-sm font-black text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.99] rounded-2xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4.5 h-4.5 stroke-[2.5]" />
              <span>Ver Nuestra Carta Completa</span>
            </Link>

            <a
              href="https://wa.me/5491172570867?text=Hola!%20Estaba%20navegando%20en%20la%20web%20y%20necesito%20ayuda%20con%20mi%20pedido."
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <div className="w-5 h-5 rounded-full bg-[#00c950] text-white flex items-center justify-center">
                <MessageCircle className="w-3 h-3 fill-white text-white" />
              </div>
              <span>Hacer Pedido por WhatsApp</span>
            </a>
          </div>

          {/* Quick Categories Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-3 text-xs font-semibold text-slate-400">
            <Link href="/#dynamicProductsContainer" className="hover:text-orange-500 transition-colors">
              🍕 Pizzas
            </Link>
            <span>•</span>
            <Link href="/#dynamicProductsContainer" className="hover:text-orange-500 transition-colors">
              🥟 Empanadas
            </Link>
            <span>•</span>
            <Link href="/#dynamicProductsContainer" className="hover:text-orange-500 transition-colors">
              🌭 Panchos & Minutas
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="w-full text-center py-4 text-xs font-medium text-slate-400">
        © {new Date().getFullYear()} Alakary • Todos los derechos reservados.
      </footer>
    </div>
  );
}
