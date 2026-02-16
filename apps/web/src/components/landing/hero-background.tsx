'use client';

import React, { useEffect, useRef } from 'react';

interface Glyph {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  size: number;
  baseSize: number;
  angle: number;
  vAngle: number;
  color: string;
  targetColor: string;
  opacity: number;
}

const GLYPHS = [
  '{ }', '[ ]', '( )', '</>', '//', '=>', '::', '...',
  '0x', '&&', '||', '!=', '==', '+=', ':=', 'fn',
  'const', 'let', 'var', 'if', 'for', 'await', 'void'
];

const ACCENT_COLOR = '#d97a4a';
const BASE_COLOR = '#1a1a1a';
const HOVER_RADIUS = 250;

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const requestRef = useRef<number>();
  const glyphsRef = useRef<Glyph[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const initGlyphs = (w: number, h: number) => {
      const density = 0.00015; // Adjustment for glyph count
      const count = Math.floor(w * h * density);
      const newGlyphs: Glyph[] = [];

      for (let i = 0; i < count; i++) {
        const size = Math.random() * 14 + 10; // 10px to 24px
        newGlyphs.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          size: size,
          baseSize: size,
          angle: Math.random() * Math.PI * 2,
          vAngle: (Math.random() - 0.5) * 0.02,
          color: BASE_COLOR,
          targetColor: BASE_COLOR,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
      glyphsRef.current = newGlyphs;
    };

    const handleResize = () => {
      if (!containerRef.current || !canvas) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      initGlyphs(width, height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Mouse interaction
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      glyphsRef.current.forEach(glyph => {
        // Update position
        glyph.x += glyph.vx;
        glyph.y += glyph.vy;
        glyph.angle += glyph.vAngle;

        // Wrap around
        if (glyph.x < -50) glyph.x = width + 50;
        if (glyph.x > width + 50) glyph.x = -50;
        if (glyph.y < -50) glyph.y = height + 50;
        if (glyph.y > height + 50) glyph.y = -50;

        // Interaction
        const dx = mx - glyph.x;
        const dy = my - glyph.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let scale = 1;

        if (dist < HOVER_RADIUS) {
          // Calculate intensity based on distance (0 to 1)
          const intensity = 1 - Math.min(dist / HOVER_RADIUS, 1);

          // Color interpolation
          glyph.color = interpolateColor(BASE_COLOR, ACCENT_COLOR, intensity);
          glyph.opacity = 0.2 + (intensity * 0.8); // Brighten up
          scale = 1 + (intensity * 0.5); // Grow slightly

          // Slight repulsion or attraction? Let's do slight rotation speed up
          glyph.angle += glyph.vAngle * 2;
        } else {
          glyph.color = BASE_COLOR;
          glyph.opacity = 0.2;
        }

        // Draw
        ctx.save();
        ctx.translate(glyph.x, glyph.y);
        ctx.rotate(glyph.angle);
        ctx.fillStyle = glyph.color;

        // Font settings
        ctx.font = `${glyph.size * scale}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = glyph.opacity;

        ctx.fillText(glyph.char, 0, 0);
        ctx.restore();
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    // Proper color interpolation
    const interpolateColor = (color1: string, color2: string, factor: number) => {
      const hex = (c: string) => {
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        return [r, g, b];
      };

      const [r1, g1, b1] = hex(color1);
      const [r2, g2, b2] = hex(color2);

      const r = Math.round(r1 + (r2 - r1) * factor);
      const g = Math.round(g1 + (g2 - g1) * factor);
      const b = Math.round(b1 + (b2 - b1) * factor);

      return `rgb(${r}, ${g}, ${b})`;
    };

    // Initial setup
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none opacity-40">
      <canvas ref={canvasRef} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent h-40 bottom-0" />
    </div>
  );
}
