"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowRight, Flame, Sparkles, Tag } from "lucide-react";
import { Product } from "./ProductCard";
import { formatMoney } from "@/lib/formatters";

interface PromoMiddleBannerProps {
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
}

export default function PromoMiddleBanner({
  products = [],
  onSelectProduct,
}: PromoMiddleBannerProps) {
  // activeSlide representa el índice real (0 .. totalSlides-1) para los indicadores
  const [activeSlide, setActiveSlide] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInteractingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const virtualIndexRef = useRef(1);

  // Generar dinámicamente las promociones a partir de los productos reales de la Base de Datos
  const promoItems = useMemo(() => {
    const badgedProducts = products.filter(
      (p) => Boolean(p.badge && p.badge.trim().length > 0)
    );

    let selectedProducts: Product[] = [];

    if (badgedProducts.length > 0) {
      selectedProducts = badgedProducts;
    } else if (products.length > 0) {
      selectedProducts = products.slice(0, 3);
    } else {
      selectedProducts = [
        {
          id: 1789065995201,
          categoryId: "pizzas-especiales",
          name: "Pancho Pizza",
          description: "Salchicha gigante gratinada con muzzarella fundida.",
          ingredients: ["Pancho gigante 25cm", "Salsa casera", "Muzzarella", "Orégano", "Aceitunas"],
          price: 3000,
          badge: "Más pedido",
          image: "/assets/images/products/pancho-pizza.jpg",
        },
        {
          id: 1789425545435,
          categoryId: "pizzas",
          name: "Pizza Mozzarella",
          description: "Masa artesanal a la piedra recién horneada.",
          ingredients: ["Masa artesanal", "Salsa de tomate", "Muzzarella fundida", "Aceitunas", "Orégano"],
          price: 16000,
          badge: "Nuevo",
          image: "/assets/images/products/pizza-muzzarella.jpg",
        },
      ];
    }

    return selectedProducts.map((p) => {
      const badgeText = (p.badge || "DESTACADO").trim();
      const isNew = /nuevo|nueva|estreno/i.test(badgeText);
      const isTop = /pedido|vendido|top|fuego|popular/i.test(badgeText);
      const IconComponent = isTop ? Flame : isNew ? Sparkles : Tag;

      return {
        product: p,
        badgeLabel: badgeText.toUpperCase(),
        badgeIcon: IconComponent,
        badgeClass: "bg-yellow-400/20 text-yellow-300 border-yellow-300/40",
        headline: p.name,
        description: p.description || p.ingredients?.join(", ") || "Plato especial preparado al momento.",
        discountBadge: badgeText.toUpperCase(),
        image: p.image || "/assets/images/logo.png",
      };
    });
  }, [products]);

  const totalSlides = promoItems.length;

  // Lista virtual con clones a los extremos para loop infinito continuo
  const virtualItems = useMemo(() => {
    if (totalSlides <= 1) return promoItems;
    return [promoItems[totalSlides - 1], ...promoItems, promoItems[0]];
  }, [promoItems, totalSlides]);

  const totalVirtualSlides = virtualItems.length;

  // Reposicionamiento instantáneo silencioso en los clones
  const checkAndPerformSilentReset = useCallback(() => {
    if (totalSlides <= 1) return;
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const slideWidth = container.clientWidth;
    if (slideWidth <= 0) return;

    const currentVirtual = Math.round(container.scrollLeft / slideWidth);

    if (currentVirtual === 0) {
      // Clon del último slide -> saltar silenciosamente al último slide real
      container.scrollLeft = totalSlides * slideWidth;
      virtualIndexRef.current = totalSlides;
      setActiveSlide(totalSlides - 1);
    } else if (currentVirtual === totalVirtualSlides - 1) {
      // Clon del primer slide -> saltar silenciosamente al primer slide real
      container.scrollLeft = 1 * slideWidth;
      virtualIndexRef.current = 1;
      setActiveSlide(0);
    }
  }, [totalSlides, totalVirtualSlides]);

  // Scroll suave al índice virtual deseado
  const scrollToVirtualSlide = useCallback(
    (vIndex: number) => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const slideWidth = container.clientWidth;
      if (slideWidth > 0) {
        isProgrammaticScrollRef.current = true;
        const realIdx = totalSlides > 1 ? (vIndex - 1 + totalSlides) % totalSlides : 0;
        setActiveSlide(realIdx);
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
    },
    [totalSlides, checkAndPerformSilentReset]
  );

  // Click directo en indicador de puntos
  const handleDotClick = (realIndex: number) => {
    if (totalSlides <= 1) {
      scrollToVirtualSlide(0);
    } else {
      scrollToVirtualSlide(realIndex + 1);
    }
  };

  // Posición inicial en el primer slide real al montar
  useEffect(() => {
    const initScroll = () => {
      if (scrollContainerRef.current && totalSlides > 1) {
        const container = scrollContainerRef.current;
        const slideWidth = container.clientWidth;
        if (slideWidth > 0) {
          container.scrollLeft = 1 * slideWidth;
          virtualIndexRef.current = 1;
          setActiveSlide(0);
        }
      }
    };

    initScroll();
    const timer = setTimeout(initScroll, 60);
    return () => clearTimeout(timer);
  }, [totalSlides]);

  // Mantener slide alineado si cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current && totalSlides > 1) {
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
  }, [totalSlides]);

  // Manejo de detección de slide al hacer scroll / swipe táctil
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const slideWidth = container.clientWidth;
    if (slideWidth > 0) {
      const ratio = scrollLeft / slideWidth;
      const nearest = Math.round(ratio);

      if (totalSlides > 1) {
        if (Math.abs(ratio - nearest) < 0.38 && nearest >= 0 && nearest < totalVirtualSlides) {
          const realIdx = (nearest - 1 + totalSlides) % totalSlides;
          if (realIdx !== activeSlide) {
            setActiveSlide(realIdx);
          }
        }

        // Comprobación de reposicionamiento cuando el scroll manual frena
        if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
        scrollEndTimerRef.current = setTimeout(() => {
          if (!isInteractingRef.current && !isDraggingRef.current) {
            checkAndPerformSilentReset();
          }
        }, 150);
      } else {
        setActiveSlide(0);
      }
    }
  };

  // Temporizador de Auto-Play que avanza de forma continua hacia adelante
  const resetAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }
    if (totalSlides <= 1) return;

    autoPlayTimerRef.current = setInterval(() => {
      if (!isInteractingRef.current && !isDraggingRef.current && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const slideWidth = container.clientWidth;
        if (slideWidth > 0) {
          const currentV = Math.round(container.scrollLeft / slideWidth);
          if (currentV >= totalVirtualSlides - 1) {
            // Si está en el clon final, normalizar a 1 y avanzar a 2
            container.scrollLeft = 1 * slideWidth;
            scrollToVirtualSlide(2);
          } else {
            scrollToVirtualSlide(currentV + 1);
          }
        }
      }
    }, 5000);
  }, [totalSlides, totalVirtualSlides, scrollToVirtualSlide]);

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

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    isInteractingRef.current = true;
    hasDraggedRef.current = false;
    isProgrammaticScrollRef.current = false;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);

    if (e.touches && e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      if (scrollContainerRef.current) {
        scrollLeftStartRef.current = scrollContainerRef.current.scrollLeft;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches || e.touches.length === 0 || !scrollContainerRef.current) return;
    const deltaX = Math.abs(e.touches[0].clientX - touchStartXRef.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartYRef.current);

    if (deltaX > 8 && deltaX > deltaY) {
      hasDraggedRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    isInteractingRef.current = false;
    resetAutoPlay();

    // Cuando el CSS scroll-snap frena el desplazamiento, verificar si cayó en clon
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    scrollEndTimerRef.current = setTimeout(() => {
      checkAndPerformSilentReset();
    }, 320);

    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 150);
  };

  // Manejadores de Mouse Drag para Desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    isInteractingRef.current = true;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStartRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
      e.preventDefault();
    }
    scrollContainerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    isInteractingRef.current = false;
    resetAutoPlay();
    if (scrollContainerRef.current && totalSlides > 1) {
      const slideWidth = scrollContainerRef.current.clientWidth;
      if (slideWidth > 0) {
        const nearestSlide = Math.round(scrollContainerRef.current.scrollLeft / slideWidth);
        scrollToVirtualSlide(Math.max(0, Math.min(totalVirtualSlides - 1, nearestSlide)));
      }
    }
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 150);
  };

  const handleProductClick = (promo: typeof promoItems[0]) => {
    if (hasDraggedRef.current) return;
    if (onSelectProduct && promo.product) {
      onSelectProduct(promo.product);
    }
  };

  return (
    <div className="b1-promo-middle-banner-wrapper my-3 sm:my-4 w-full select-none">
      {/* Contenedor con carrusel horizontal fluido de punta a punta */}
      <div className="relative w-full h-[195px] sm:h-[205px] overflow-hidden shadow-md shadow-red-950/20">
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
            cursor: "grab",
          }}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar active:cursor-grabbing"
        >
          {virtualItems.map((promo, virtualIdx) => {
            const BadgeIcon = promo.badgeIcon || Flame;

            return (
              <div
                key={`promo-v-${virtualIdx}-${promo.product.id || virtualIdx}`}
                onClick={() => handleProductClick(promo)}
                className="w-full min-w-full shrink-0 snap-center snap-always h-full relative overflow-hidden px-4 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-[#D91B2B] via-[#E22030] to-[#FF4B3A] border-y border-white/15 cursor-pointer flex flex-col justify-between"
              >
                {/* Luces sutiles de fondo */}
                <div className="absolute -right-6 -top-6 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-yellow-400/15 rounded-full blur-lg pointer-events-none" />

                {/* Contenedor centrado para mantener alineación prolija */}
                <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto h-full flex flex-col justify-between">
                  {/* Fila Principal */}
                  <div className="relative z-10 flex flex-row items-center justify-between gap-3.5 sm:gap-5 flex-1 min-h-0">
                    {/* Lado Izquierdo: Textos */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                      <div>
                        {/* Badge */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full backdrop-blur-xs text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1 border shadow-xs ${promo.badgeClass}`}
                        >
                          <BadgeIcon className="w-3 h-3 text-yellow-300 fill-yellow-300 shrink-0" />
                          <span>{promo.badgeLabel}</span>
                        </div>

                        {/* Título Principal */}
                        <h3 className="text-base sm:text-lg md:text-xl font-black text-white leading-tight tracking-tight truncate">
                          {promo.headline}
                        </h3>

                        {/* Subtítulo / Descripción (2 líneas con text-balance y elipsis) */}
                        <p
                          style={{ textWrap: "balance" }}
                          className="text-xs sm:text-[13px] text-white/90 font-medium mt-1 leading-snug line-clamp-2 text-balance"
                        >
                          {promo.description}
                        </p>
                      </div>

                      {/* Precio y Botón CTA Agrandados y Visibles */}
                      <div className="flex items-center gap-3 pt-1 mt-auto">
                        <span className="text-yellow-300 font-black text-base sm:text-lg shrink-0 leading-none drop-shadow-xs">
                          $ {formatMoney(promo.product.price)}
                        </span>

                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white text-[#D91B2B] text-xs sm:text-sm font-black shadow-md group-hover:bg-yellow-300 group-hover:text-neutral-900 transition-colors shrink-0">
                          <span>Aprovechar ahora</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>

                    {/* Lado Derecho: Imagen del Producto Agrandada */}
                    <div className="shrink-0 relative w-[112px] h-[112px] sm:w-[128px] sm:h-[128px]">
                      <div className="absolute -top-2 -left-2 z-20 bg-yellow-300 text-neutral-900 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white">
                        <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        <span>{promo.discountBadge}</span>
                      </div>

                      <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border-2 border-white/40 bg-white/10">
                        <img
                          src={promo.image}
                          alt={promo.headline}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicadores de slides circulares con soporte click directo */}
      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-2.5 mt-2.5 select-none">
          {promoItems.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleDotClick(idx)}
              aria-label={`Ver promoción ${idx + 1}`}
              style={{
                width: activeSlide === idx ? "22px" : "8px",
                height: "8px",
                borderRadius: activeSlide === idx ? "9999px" : "50%",
                border: "none",
                padding: 0,
                outline: "none",
                cursor: "pointer",
              }}
              className={`transition-all duration-300 ${
                activeSlide === idx
                  ? "bg-[#D91B2B] shadow-xs"
                  : "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
