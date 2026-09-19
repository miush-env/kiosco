"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Bike } from "lucide-react";

interface HeroBannerProps {
  storeName?: string;
}

export default function HeroBanner({ storeName = "Alakary" }: HeroBannerProps) {
  // currentSlide representa el índice real (0, 1 o 2) para el indicador inferior
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const virtualIndexRef = useRef(1);

  const totalSlides = 3;
  // Diapositivas virtuales: [Clon 2, Slide 0, Slide 1, Slide 2, Clon 0]
  const virtualSlideOrder = [2, 0, 1, 2, 0];
  const totalVirtualSlides = virtualSlideOrder.length; // 5

  // Reposicionamiento silencioso instantáneo cuando se aterriza en un clon
  const checkAndPerformSilentReset = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const slideWidth = container.clientWidth;
    if (slideWidth <= 0) return;

    const currentVirtual = Math.round(container.scrollLeft / slideWidth);

    if (currentVirtual === 0) {
      // Estamos en Clon de Slide 2 -> saltar silenciosamente al Slide 2 real (índice virtual 3)
      container.scrollLeft = 3 * slideWidth;
      virtualIndexRef.current = 3;
      setCurrentSlide(2);
    } else if (currentVirtual === totalVirtualSlides - 1) {
      // Estamos en Clon de Slide 0 -> saltar silenciosamente al Slide 0 real (índice virtual 1)
      container.scrollLeft = 1 * slideWidth;
      virtualIndexRef.current = 1;
      setCurrentSlide(0);
    }
  }, [totalVirtualSlides]);

  // Scroll suave al índice virtual deseado
  const scrollToVirtualSlide = useCallback((vIndex: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const slideWidth = container.clientWidth;
      if (slideWidth > 0) {
        isProgrammaticScrollRef.current = true;
        const realIdx = (vIndex - 1 + totalSlides) % totalSlides;
        setCurrentSlide(realIdx);
        virtualIndexRef.current = vIndex;

        container.scrollTo({
          left: vIndex * slideWidth,
          behavior: "smooth",
        });

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          checkAndPerformSilentReset();
          isProgrammaticScrollRef.current = false;
        }, 500);
      }
    }
  }, [totalSlides, checkAndPerformSilentReset]);

  // Click directo en indicador de puntos (real index 0, 1, 2)
  const handleDotClick = (realIndex: number) => {
    const targetVirtual = realIndex + 1;
    scrollToVirtualSlide(targetVirtual);
  };

  // Inicialización de scroll en el slide 0 real (índice virtual 1) al montar
  useEffect(() => {
    const initScroll = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const slideWidth = container.clientWidth;
        if (slideWidth > 0) {
          container.scrollLeft = 1 * slideWidth;
          virtualIndexRef.current = 1;
          setCurrentSlide(0);
        }
      }
    };

    initScroll();
    const timer = setTimeout(initScroll, 60);
    return () => clearTimeout(timer);
  }, []);

  // Mantener slide alineado si cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const slideWidth = container.clientWidth;
        if (slideWidth > 0) {
          const currentV = Math.round(container.scrollLeft / slideWidth);
          container.scrollLeft = currentV * slideWidth;
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Manejo de detección de slide al hacer scroll / swipe táctil con histéresis y reseteo silencioso
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const slideWidth = container.clientWidth;
    if (slideWidth > 0) {
      const ratio = scrollLeft / slideWidth;
      const nearest = Math.round(ratio);

      // Histeresis: solo cambiar el indicador cuando el slide esté cerca del centro
      if (Math.abs(ratio - nearest) < 0.38 && nearest >= 0 && nearest < totalVirtualSlides) {
        const realIdx = (nearest - 1 + totalSlides) % totalSlides;
        if (realIdx !== currentSlide) {
          setCurrentSlide(realIdx);
        }
      }

      // Comprobar silenciosamente reposicionamiento cuando el scroll manual frena
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = setTimeout(() => {
        if (!isInteractingRef.current && !isDraggingRef.current) {
          checkAndPerformSilentReset();
        }
      }, 150);
    }
  };

  // Temporizador de Auto-Play infinito hacia adelante
  const resetAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }
    autoPlayTimerRef.current = setInterval(() => {
      if (!isInteractingRef.current && !isDraggingRef.current && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const slideWidth = container.clientWidth;
        if (slideWidth > 0) {
          const currentV = Math.round(container.scrollLeft / slideWidth);
          if (currentV >= totalVirtualSlides - 1) {
            // Si está en el clon final, normalizar primero a 1 y avanzar a 2
            container.scrollLeft = 1 * slideWidth;
            scrollToVirtualSlide(2);
          } else {
            scrollToVirtualSlide(currentV + 1);
          }
        }
      }
    }, 6000);
  }, [totalVirtualSlides, scrollToVirtualSlide]);

  useEffect(() => {
    resetAutoPlay();
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    };
  }, [resetAutoPlay]);

  // Manejadores de Touch Swipe dedicados para móviles
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isSwipingHorizontallyRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isInteractingRef.current = true;
    isProgrammaticScrollRef.current = false;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);

    if (e.touches && e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      isSwipingHorizontallyRef.current = false;
      if (scrollContainerRef.current) {
        scrollLeftStartRef.current = scrollContainerRef.current.scrollLeft;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches || e.touches.length === 0 || !scrollContainerRef.current) return;
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    const deltaY = e.touches[0].clientY - touchStartYRef.current;

    if (!isSwipingHorizontallyRef.current && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
      isSwipingHorizontallyRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    isInteractingRef.current = false;
    resetAutoPlay();
    isSwipingHorizontallyRef.current = false;

    // Cuando el CSS scroll snap frena naturalmente el deslizamiento, verificar si cayó en clon
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = setTimeout(() => {
      checkAndPerformSilentReset();
    }, 320);
  };

  // Manejadores de Mouse Drag para Desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    isInteractingRef.current = true;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStartRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    if (Math.abs(walk) > 5) {
      e.preventDefault();
    }
    scrollContainerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    isInteractingRef.current = false;
    resetAutoPlay();
    if (scrollContainerRef.current) {
      const slideWidth = scrollContainerRef.current.clientWidth;
      if (slideWidth > 0) {
        const nearestSlide = Math.round(scrollContainerRef.current.scrollLeft / slideWidth);
        scrollToVirtualSlide(Math.max(0, Math.min(totalVirtualSlides - 1, nearestSlide)));
      }
    }
  };

  // Renderizador modular para cada diapositiva
  const renderSlideContent = (realIndex: number, uniqueKey: string) => {
    if (realIndex === 0) {
      // ── SLIDE 0: Pancho Pizza ──
      return (
        <div
          key={uniqueKey}
          className="w-full min-w-full shrink-0 snap-center snap-always h-full relative overflow-hidden bg-transparent flex items-center justify-between px-4 sm:px-8 py-3 text-white max-w-md md:max-w-xl lg:max-w-2xl mx-auto"
        >
          <div className="flex-1 pr-2 z-10 max-w-[62%] sm:max-w-[64%] flex flex-col justify-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-fit mb-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>¡Especial de la Casa!</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black leading-tight text-white drop-shadow-xs tracking-tight">
              Pancho Pizza
            </h2>

            <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium leading-snug line-clamp-2">
              Salchicha XL envuelta en masa crocante y gratinada con abundante muzzarella. ¡Tentate hoy!
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-[#FFE600] drop-shadow-xs">
                $ 3.000
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-white/90 bg-black/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Imperdible
              </span>
            </div>
          </div>

          <div className="w-[38%] sm:w-[36%] h-full flex items-center justify-center relative pointer-events-none z-10">
            <img
              src="/assets/images/products/pancho-pizza-nobg.png"
              alt="Pancho Pizza Especial"
              className="w-full max-h-[92%] object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] transform -rotate-3 scale-105"
            />
          </div>
        </div>
      );
    }

    if (realIndex === 1) {
      // ── SLIDE 1: Video Promocional Enmarcado Armonioso ──
      return (
        <div
          key={uniqueKey}
          className="w-full min-w-full shrink-0 snap-center snap-always h-full relative overflow-hidden bg-transparent flex items-center justify-between px-4 sm:px-8 py-3 text-white max-w-md md:max-w-xl lg:max-w-2xl mx-auto"
        >
          <div className="flex-1 pr-2 z-10 max-w-[62%] sm:max-w-[64%] flex flex-col justify-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] font-black uppercase tracking-wider w-fit mb-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>¡Sabor en Vivo!</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black leading-tight text-white drop-shadow-xs tracking-tight">
              Masa & Fuego
            </h2>

            <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium leading-snug line-clamp-2">
              Mirá cómo preparamos cada pedido con ingredientes frescos y horneado artesanal perfecto.
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold text-white/90 bg-black/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                100% Casero
              </span>
            </div>
          </div>

          <div className="w-[38%] sm:w-[36%] h-full flex items-center justify-center relative pointer-events-none z-10">
            <div className="w-full max-h-[92%] aspect-video sm:aspect-square rounded-2xl overflow-hidden shadow-lg border border-white/25 bg-black/40 flex items-center justify-center">
              <video
                src="/assets/images/banner.mp4"
                poster="/assets/images/banner.jpg"
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                controls={false}
                controlsList="nodownload nofullscreen noremoteplayback"
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      );
    }

    // ── SLIDE 2: Delivery Rápido ──
    return (
      <div
        key={uniqueKey}
        className="w-full min-w-full shrink-0 snap-center snap-always h-full relative overflow-hidden bg-transparent flex items-center justify-between px-4 sm:px-8 py-3 text-white max-w-md md:max-w-xl lg:max-w-2xl mx-auto"
      >
        <div className="flex-1 pr-3 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] sm:text-[11px] font-bold uppercase tracking-wider w-fit mb-1.5 shadow-xs">
            <Bike className="w-3.5 h-3.5 text-white" />
            <span>Delivery Rápido</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-xs">
            ¡Directo a tu Mesa!
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium leading-snug">
            Tus platos favoritos recién preparados, listos para compartir y disfrutar en familia.
          </p>
        </div>
        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center z-10">
          <img
            src="/assets/images/delivery-on-the-way.svg"
            alt="Delivery Alakary"
            className="w-full h-full object-contain filter drop-shadow-md"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <section className="w-full bg-[#DF381A] pt-0 pb-4 select-none overflow-hidden rounded-bl-[18px] sm:rounded-bl-[22px] rounded-br-[72px] sm:rounded-br-[88px] shadow-md shadow-red-950/10">
      <div className="w-full">
        {/* Contenedor Principal del Carrusel (Full width fluido) */}
        <div className="relative w-full h-[190px] sm:h-[215px] overflow-hidden bg-[#DF381A]">
          {/* Scroll Container Horizontal con Snap, Swipe táctil y Mouse Drag */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {/* Lista virtual de 5 slides para loop continuo infinito */}
            {virtualSlideOrder.map((realIdx, virtualIdx) =>
              renderSlideContent(realIdx, `vslide-${virtualIdx}-${realIdx}`)
            )}
          </div>
        </div>

        {/* ── INDICADORES ASIMÉTRICOS DEBAJO DEL CARRUSEL (3 PUNTOS REALES) ── */}
        <div className="flex items-center justify-center gap-2 mt-2.5 select-none">
          {Array.from({ length: totalSlides }).map((_, idx) => {
            const isActive = currentSlide === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDotClick(idx)}
                style={{
                  borderRadius: isActive ? "9999px" : "50%",
                  width: isActive ? "26px" : "8px",
                  height: "8px",
                  minWidth: isActive ? "26px" : "8px",
                  minHeight: "8px",
                  border: "none",
                  padding: 0,
                  margin: 0,
                  outline: "none",
                  cursor: "pointer",
                  display: "inline-block",
                  boxSizing: "border-box",
                }}
                className={`transition-all duration-300 ease-out shrink-0 focus:outline-none ${
                  isActive
                    ? "bg-white shadow-xs"
                    : "bg-white/45 hover:bg-white/75"
                }`}
                aria-label={`Ir al slide ${idx + 1}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
