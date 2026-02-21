'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const BRAND_COLOR = 'hsl(18 76% 58%)';

const traditionalTasks = [
  { task: 'Environment & Monorepo Setup', time: '30 min' },
  { task: 'Architecture & Schema Design', time: '45 min' },
  { task: 'Smart Contract Coding & Unit Tests', time: '120 min' },
  { task: 'Backend API & Middleware Logic', time: '90 min' },
  { task: 'Frontend Components & Styling', time: '60 min' },
  { task: 'Web3 Integration & Contract Hooks', time: '60 min' },
  { task: 'Integration Testing & Debugging', time: '60 min' },
];

export function Comparison() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const traditionalRef = useRef<HTMLDivElement>(null);
  const nskillsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.from(titleRef.current, {
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 80%',
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      // Staggered tasks animation
      gsap.from('.traditional-task', {
        scrollTrigger: {
          trigger: traditionalRef.current,
          start: 'top 70%',
        },
        x: -20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power2.out',
      });

      // NSkills side animation
      gsap.from(nskillsRef.current, {
        scrollTrigger: {
          trigger: nskillsRef.current,
          start: 'top 70%',
        },
        x: 20,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      // Pulse effect for the < 1 min text
      gsap.to('.pulse-text', {
        scale: 1.05,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, sectionRef.current!);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-[#050505] text-white overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-20 relative">
          {/* Top accent line */}
          <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#d97a4a] to-transparent shadow-[0_0_15px_rgba(217,122,74,0.5)]" />

          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-[#d97a4a] text-sm font-mono tracking-[0.3em] uppercase">Comparison</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-7xl font-display font-bold tracking-tight px-4">
            Traditional Method vs <span style={{ color: BRAND_COLOR }}>[N]Skills</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start max-w-5xl mx-auto px-4 sm:px-0">
          {/* Traditional Column */}
          <div ref={traditionalRef} className="space-y-6 sm:space-y-8 p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-display font-semibold italic text-white/70">From Scratch</h3>
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Manual Build</span>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {traditionalTasks.map((item, idx) => (
                <div key={idx} className="traditional-task flex justify-between items-center group/item text-sm sm:text-base">
                  <span className="text-white/60 group-hover/item:text-white transition-colors">{item.task}</span>
                  <span className="text-white/40 font-mono text-xs sm:text-sm">{item.time}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 sm:pt-6 border-t border-white/10 mt-6 sm:mt-8">
              <div className="flex justify-between items-center text-lg sm:text-xl font-bold">
                <span>Total Effort</span>
                <span className="text-white">465 min</span>
              </div>
            </div>

            <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-white/40 leading-relaxed italic">
              "A professional developer spends nearly a full work day just to reach the starting line. For non-technical users, this phase can take weeks of constant learning."
            </p>
          </div>

          {/* NSkills Column */}
          <div ref={nskillsRef} className="relative p-6 sm:p-10 h-full flex flex-col justify-center min-h-[350px] sm:min-h-[450px] bg-white/[0.02] rounded-2xl border border-[hsl(18_76%_58%)]/20">
            {/* Divider for desktop */}
            <div className="hidden lg:block absolute left-[-24px] top-10 bottom-10 w-[1px] bg-white/10" />

            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-display font-semibold italic mb-3 sm:mb-4" style={{ color: BRAND_COLOR }}>[N]Skills</h3>

              <div className="mb-6 sm:mb-8">
                <span className="pulse-text text-5xl sm:text-7xl md:text-8xl font-display font-bold block mb-2 sm:mb-4">
                  &lt;1 min
                </span>
                <p className="text-lg sm:text-xl text-white/90 leading-relaxed font-semibold">
                  Instant Blueprint to Codebase
                </p>
              </div>

              <div className="space-y-6 text-white/70 leading-relaxed font-medium">
                <p>
                  Get a complete, production-ready foundation in seconds. Based on your selected templates and plugins, NSkills generates the entire raw codebase with best practices already baked in.
                </p>
                <p>
                  Don't waste days on boilerplate. We provide the structural heavy lifting so you can focus on building what matters—your unique features.
                </p>
              </div>

              {/* Decorative Glow */}
              <div className="absolute inset-0 -z-10 bg-[hsl(18_76%_58%)]/15 blur-[120px] rounded-full" />
            </div>
          </div>
        </div>

        <div className="mt-20 text-center max-w-3xl mx-auto">
          <p className="text-white/40 text-sm font-mono uppercase tracking-[0.2em]">
            Stop Building From Scratch. Start Building From Success.
          </p>
        </div>
      </div>
    </section>
  );
}
