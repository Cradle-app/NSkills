'use client';

import React from 'react';

export function HeroCanvas() {

  return (
    <div className="relative w-full h-full overflow-hidden group/canvas">
      {/* Background Grid Pattern (Static subtle lines) - Lowest Layer */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(220 10% 25%) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(220 10% 25%) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />


      {/* Main Grid Overlay for Animation - Middle Layer */}
      {/* <div className="absolute inset-0 z-10 grid grid-cols-[repeat(24,1fr)] grid-rows-[repeat(12,1fr)] w-full h-full pointer-events-none">
        {blocks.map((i) => (
          <div
            key={i}
            className="grid-block opacity-0 border-[0.5px] border-white/[0.03]"
            style={{
              willChange: 'opacity, background-color',
              transition: 'opacity 0.5s ease'
            }}
          />
        ))}
      </div> */}

      {/* Content Container - Flex column for Header + Video */}
      <div className="absolute inset-0 z-20 flex flex-col">

        {/* Minimal Header */}
        <div className="flex-none h-10 px-4 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80" />
            </div>
            <div className="w-[1px] h-3 bg-white/10 mx-2" />
            <span className="text-[10px] text-white/40 tracking-wider font-mono">NSKILLS_PREVIEW</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d97a4a] animate-pulse" />
          </div>
        </div>

        {/* Video Area - Centered and Contained */}
        <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden p-1">
          <video
            className="max-w-full max-h-full w-auto h-auto object-contain shadow-2xl rounded-xl"
            src="/assets/nskills.mp4"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
          />
        </div>
      </div>

      <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-xl overflow-hidden">
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-right from-transparent via-[#d97a4a]/30 to-transparent" />
        <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-right from-transparent via-[#d97a4a]/20 to-transparent" />
      </div>
    </div>
  );
}
