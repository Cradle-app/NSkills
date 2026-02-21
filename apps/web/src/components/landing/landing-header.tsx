"use client";

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/logo.png';

// Register ScrollTrigger for client-side
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function LandingHeader() {
  const headerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Elegant entrance animation
      gsap.fromTo(headerRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", delay: 0.5 }
      );

      // Smooth scroll-based hiding - using ScrollTrigger.create for more granular control
      ScrollTrigger.create({
        trigger: 'body',
        start: 'top top',
        end: '+=300', // Specific pixel distance for predictability
        scrub: true,
        onUpdate: (self) => {
          if (headerRef.current) {
            // Calculate progress manually to ensure perfect sync and reversal
            const p = self.progress;
            gsap.set(headerRef.current, {
              opacity: 1 - p,
              y: -p * 30,
              pointerEvents: p > 0.8 ? 'none' : 'auto'
            });
          }
        }
      });
    }, headerRef); // scope to component

    return () => ctx.revert();
  }, []);

  // Spotlight effect logic using accent color
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!innerRef.current) return;
    const rect = innerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    innerRef.current.style.setProperty('--mouse-x', `${x}px`);
    innerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-8 px-6 sm:px-10 pointer-events-none"
    >
      <div
        ref={innerRef}
        onMouseMove={handleMouseMove}
        className="
          pointer-events-auto group relative flex items-center justify-between 
          w-full max-w-5xl h-14 pl-5 pr-1.5 rounded-2xl
          bg-forge-bg/40 backdrop-blur-2xl
          border border-white/[0.08] hover:border-white/[0.15]
          transition-all duration-700 ease-out
          shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)]
          overflow-hidden
        "
      >
        {/* Interactive Spotlight Layer - Subtle Warm Glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(217, 122, 74, 0.1), transparent 80%)`
          }}
        />

        {/* Border Glow Effect - Follows the mouse */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
          style={{
            background: `radial-gradient(150px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.15), transparent 80%)`,
            padding: '1px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Logo Section */}
        <Link href="/">
          <Image src={logo} alt="[N]Skills" width={100} height={100} className="w-24 sm:w-32" />
        </Link>

        {/* Actions */}
        <div className="relative z-10 flex items-center gap-4">
          <Link
            href="/app"
            className="
              relative flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg
              bg-white text-black text-[10px] sm:text-[12px] font-bold
              hover:bg-[#d97a4a] hover:text-white
              transition-all duration-500 active:scale-95
              shadow-[0_4px_12px_rgba(255,255,255,0.05)]
              hover:shadow-[0_8px_20px_rgba(217,122,74,0.4)]
            "
          >
            <span>Launch App</span>
            <svg
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Perspective Shadow Overlay */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl" />
      </div>
    </header>
  );
}