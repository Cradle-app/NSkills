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

      {/* Content Layer (The "App" interface simulation) - Top Layer */}
      <div className="absolute inset-0 z-20 flex flex-col p-6 md:p-10 font-mono">


        {/* Fake UI Header */}
        <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-6">
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]/80 shadow-[0_0_8px_rgba(255,95,86,0.3)]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]/80 shadow-[0_0_8px_rgba(255,189,46,0.3)]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]/80 shadow-[0_0_8px_rgba(39,201,63,0.3)]" />
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="flex items-center gap-3 px-3 py-1 rounded-md bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-[#d97a4a] animate-pulse" />
              <span className="text-[10px] text-white/50 tracking-wider">NSKILLS_TERMINAL_V3.0</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="px-3 py-1 rounded bg-[#d97a4a]/10 border border-[#d97a4a]/20 text-[10px] text-[#d97a4a]">ACTIVE_SESSION</div>
            <div className="text-[10px] text-white/30 uppercase tracking-widest">04:12:03</div>
          </div>
        </div>

        {/* Fake Code Content - Claude Code Style with Enhanced Syntax */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4 text-sm md:text-base lg:text-lg leading-relaxed max-w-3xl">
            <div className="flex gap-8 group/line">
              <span className="text-white/10 select-none w-6 text-right transition-colors group-hover/line:text-white/30">01</span>
              <span className="text-white/80">
                <span className="text-[#c678dd]">import</span> <span className="text-[#e5c07b]">Agent</span> <span className="text-[#c678dd]">from</span> <span className="text-[#98c379]">'@nskills/core'</span>;
              </span>
            </div>
            <div className="flex gap-8 group/line">
              <span className="text-white/10 select-none w-6 text-right transition-colors group-hover/line:text-white/30">02</span>
              <span className="text-white/80">
                <span className="text-[#c678dd]">import</span> <span className="text-[#e06c75]">{'{'}</span> <span className="text-[#61afef]">autonomous</span> <span className="text-[#e06c75]">{'}'}</span> <span className="text-[#c678dd]">from</span> <span className="text-[#98c379]">'@nskills/skills'</span>;
              </span>
            </div>
            <div className="flex gap-8">
              <span className="text-white/10 select-none w-6 text-right">03</span>
              <span className="text-white/40">// Initialize autonomous coding agent</span>
            </div>
            <div className="flex gap-8 group/line">
              <span className="text-white/10 select-none w-6 text-right transition-colors group-hover/line:text-white/30">04</span>
              <span className="text-white/80">
                <span className="text-[#c678dd]">const</span> <span className="text-[#61afef]">engineer</span> = <span className="text-[#c678dd]">await</span> <span className="text-[#e5c07b]">Agent</span>.<span className="text-[#61afef]">initialize</span>({'{'}
              </span>
            </div>
            <div className="flex gap-8 group/line">
              <span className="text-white/10 select-none w-6 text-right transition-colors group-hover/line:text-white/30">05</span>
              <span className="text-white/80 pl-8">
                <span className="text-[#e06c75]">name:</span> <span className="text-[#98c379]">'Cradle-X'</span>,
              </span>
            </div>
            <div className="flex gap-8 group/line">
              <span className="text-white/10 select-none w-6 text-right transition-colors group-hover/line:text-white/30">06</span>
              <span className="text-white/80 pl-8">
                <span className="text-[#e06c75]">mode:</span> <span className="text-[#61afef]">autonomous</span>,
              </span>
            </div>
            <div className="flex gap-8 group/line">
              <span className="text-white/10 select-none w-6 text-right transition-colors group-hover/line:text-white/30">07</span>
              <span className="text-white/80 pl-8">
                <span className="text-[#e06c75]">capabilities:</span> <span className="text-[#d19a66]">['coding', 'architecture', 'optimization']</span>
              </span>
            </div>
            <div className="flex gap-8 group/line">
              <span className="text-white/10 select-none w-6 text-right transition-colors group-hover/line:text-white/30">08</span>
              <span className="text-white/80">
                {'}'});
              </span>
            </div>
            <div className="flex gap-8">
              <span className="text-white/10 select-none w-6 text-right">09</span>
              <span className="text-white/80"></span>
            </div>
            <div className="flex gap-8 group/line">
              <span className="text-white/10 select-none w-6 text-right transition-colors group-hover/line:text-white/30">10</span>
              <span className="text-white/80">
                <span className="text-[#61afef]">engineer</span>.<span className="text-[#61afef]">execute</span>(<span className="text-[#98c379]">'Architect the future of AI development.'</span>);
              </span>
            </div>
          </div>
        </div>

        {/* Footer Area with decorative elements */}
        <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-white/20 tracking-[0.2em] font-mono">
          <div className="flex gap-6">
            <span className="hover:text-[#d97a4a] transition-colors cursor-default">READY</span>
            <span className="hover:text-[#d97a4a]/60 transition-colors cursor-default">UTF-8</span>
            <span className="hover:text-[#d97a4a]/40 transition-colors cursor-default">LINUX</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#d97a4a] animate-pulse" />
            <span className="text-white/40">CONNECTION_ESTABLISHED</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-xl overflow-hidden">
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-right from-transparent via-[#d97a4a]/30 to-transparent" />
        <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-right from-transparent via-[#d97a4a]/20 to-transparent" />
      </div>
    </div>
  );
}
