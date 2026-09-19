"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";

interface FloatingBackButtonProps {
  isVisible: boolean;
}

export default function FloatingBackButton({ isVisible }: FloatingBackButtonProps) {
  if (!isVisible) return null;

  const handleBack = () => {
    if (typeof window !== "undefined") {
      if (window.scrollY > 300) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
        window.history.back();
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <button
      type="button"
      className="b1-floating-back-btn fixed bottom-24 right-4 sm:right-6 z-[950] w-12 h-12 rounded-full bg-surface text-text-main shadow-2xl shadow-black/30 border-2 border-[var(--b1-color-border,#E8E4DD)] flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-90 hover:border-primary hover:text-primary"
      onClick={handleBack}
      title="Volver hacia arriba / atrás"
      aria-label="Volver atrás"
    >
      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
    </button>
  );
}
