'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import Image from 'next/image';
import logo from '@/assets/logo.png';


gsap.registerPlugin(ScrollTrigger);

export function LandingFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Large brand text reveal
      if (brandRef.current) {
        gsap.fromTo(
          brandRef.current,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: brandRef.current,
              start: 'top 90%',
              toggleActions: 'play reverse play reverse',
            },
          }
        );
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="relative pt-20 pb-8 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-forge-border/50 to-transparent" />

      {/* Large brand name - full width */}
      <div ref={brandRef} className="container mx-auto px-6 mb-16">
        <div className="text-center">
          <h2
            className="text-[clamp(4rem,15vw,12rem)] font-display font-black tracking-widest leading-none select-none"
            style={{
              background: 'linear-gradient(180deg, hsl(18 60% 50%) 0%, hsl(18 45% 30%) 50%, hsl(220 15% 15%) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            [N]SKILLS
          </h2>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-forge-border/30">
          {/* Logo + Copyright */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={logo}
                alt="[N]Skills Logo"
                width={100}
                height={100}
                className="w-28"
              />
            </Link>
            <span className="text-forge-text-secondary text-xs">
              · © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          {/* Minimal text */}
          <p className="text-forge-text-secondary text-xs">
            Structure enables creativity. Built for Arbitrum.
          </p>
        </div>
      </div>
    </footer>
  );
}
