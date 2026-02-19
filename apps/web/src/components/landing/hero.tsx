'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HeroCanvas } from './HeroCanvas';
import { HeroBackground } from './hero-background';

gsap.registerPlugin(ScrollTrigger);

const ACCENT_COLOR = '#d97a4a'; // Warm terracotta/coral

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial Entry Animation
      const entryTl = gsap.timeline();

      entryTl
        .fromTo(
          badgeRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
        )
        .fromTo(
          headingRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
          '-=0.5'
        )
        .fromTo(
          subtitleRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.7'
        )
        .fromTo(
          canvasWrapperRef.current,
          { opacity: 0, y: 100, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' },
          '-=0.8'
        );

      // Scroll Animation Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
        },
      });

      // Step 1: Text fades out and moves up, Canvas scales up to full screen
      tl.to(textContainerRef.current, {
        opacity: 0,
        y: -150,
        scale: 0.85,
        duration: 0.8,
        ease: 'power2.inOut',
      }, 'start')

        .to(canvasWrapperRef.current, {
          width: '100vw',
          height: '100vh',
          borderRadius: '0px',
          maxWidth: '100%',
          margin: 0,
          top: 0,
          duration: 1.2,
          ease: 'power2.inOut',
        }, 'start');

    }, containerRef.current ?? undefined);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative bg-[#050505] text-white overflow-hidden h-screen">

      {/* Interactive Background */}
      <HeroBackground />

      {/* Main Stage - Holds both Text and Canvas */}
      <div className="absolute inset-0 flex flex-col items-center z-20 pointer-events-none">

        {/* Centered Text Content - Positioned in the upper half */}
        <div
          ref={textContainerRef}
          className="flex flex-col items-center justify-center px-6 mt-[20vh]"
        >
          <div className="max-w-5xl mx-auto text-center space-y-10">
            <h1 ref={headingRef} className="text-5xl md:text-7xl lg:text-8xl font-display font-semibold tracking-[-0.03em] leading-[1.1] relative">
              <span className="relative inline-block">
                Build your Web3 foundation. <br />
                <span className="bg-gradient-to-b from-[#d97a4a] via-white to-white/40 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(217,122,74,0.3)]">
                  Then vibe.
                </span>
              </span>
              {/* Decorative accent line */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-[#d97a4a] to-transparent opacity-60" />
            </h1>

            <p ref={subtitleRef} className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
              Visual foundation builder for Web3 projects. Design visually, generate structured code, then fine-tune with AI.
              <span className="text-white/80 block mt-2 font-normal italic">Structure enables creativity.</span>
            </p>
          </div>
        </div>

        {/* Hero Canvas Container - Positioned lower to avoid overlap */}
        <div
          ref={canvasWrapperRef}
          className="absolute w-[85vw] max-w-[1400px] aspect-[16/10] bg-[#0a0c10] rounded-2xl overflow-hidden border border-white/10 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.9)] z-10 top-[78vh]"
          style={{
            willChange: 'width, height, borderRadius, top, transform',
            transform: 'translateY(-10%)'
          }}
        >
          <HeroCanvas />

          {/* Inner shadow/reflection overlay */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
