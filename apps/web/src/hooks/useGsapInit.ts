'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useGsapInit() {
  useEffect(() => {
    // Configure GSAP defaults
    gsap.defaults({
      ease: 'power3.out',
      duration: 1,
    });

    // Configure ScrollTrigger defaults
    ScrollTrigger.defaults({
      toggleActions: 'play reverse play reverse', // Works in both directions
    });

    // Refresh on resize for responsive
    const handleResize = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ScrollTrigger.killAll();
    };
  }, []);
}
