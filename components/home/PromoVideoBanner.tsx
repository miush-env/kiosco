"use client";

import React from "react";

export default function PromoVideoBanner() {
  return (
    <section className="b1-promo-video-section px-4 max-w-md md:max-w-xl lg:max-w-2xl mx-auto my-3 select-none">
      <div className="relative w-full h-[185px] sm:h-[210px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-slate-200/70 dark:border-slate-800 bg-slate-950">
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
          className="w-full h-full object-cover pointer-events-none select-none"
        />
      </div>
    </section>
  );
}
