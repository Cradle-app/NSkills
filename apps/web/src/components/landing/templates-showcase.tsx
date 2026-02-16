'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { TEMPLATES } from '@/data/templates';

const ACCENT_COLOR = '#d97a4a';

// Map real templates to the showcase format
const showCaseTemplates = TEMPLATES.map(t => ({
  title: t.name,
  description: t.description,
  // Extract up to 3 characteristic node types for the tags
  nodes: t.nodes.slice(0, 3).map(n => {
    // Clean up types like 'stylus-rust-contract' to 'Stylus'
    const type = n.type.split('-')[0];
    return type.charAt(0).toUpperCase() + type.slice(1);
  }),
}));

function TemplateCard({
  template,
  index,
  total,
  dragX
}: {
  template: typeof showCaseTemplates[0];
  index: number;
  total: number;
  dragX: any;
}) {
  const router = useRouter();
  const [cardWidth, setCardWidth] = useState(380);
  const gap = 30;

  useEffect(() => {
    const handleResize = () => {
      setCardWidth(Math.min(380, window.innerWidth - 60));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalWidth = (cardWidth + gap) * total;

  const x = useTransform(dragX, (value: number) => {
    const basePos = (index - (total - 1) / 2) * (cardWidth + gap);
    let wrappedX = (value + basePos) % totalWidth;
    if (wrappedX > totalWidth / 2) wrappedX -= totalWidth;
    if (wrappedX < -totalWidth / 2) wrappedX += totalWidth;
    return wrappedX;
  });

  const y = useTransform(x, (val: number) => (val * val) * 0.0001);
  const rotate = useTransform(x, (val: number) => val * 0.01);
  const scale = useTransform(x, (val: number) => {
    const absX = Math.abs(val);
    return Math.max(0.8, 1 - absX / 2500);
  });

  const zIndex = useTransform(x, (val: number) => Math.round(100 - Math.abs(val) / 10));
  const opacity = useTransform(x, (val: number) => {
    const absX = Math.abs(val);
    if (absX > totalWidth / 2 - 20) return 0;
    return 1 - (absX - 600) / 800;
  });

  const handleDiscover = () => {
    router.push('/app');
  };

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        scale,
        zIndex,
        opacity,
        width: cardWidth,
        marginLeft: -cardWidth / 2,
      }}
      className="absolute left-1/2 top-20 select-none pointer-events-none"
    >
      <div className="relative aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden bg-forge-bg border border-white/[0.06] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] group pointer-events-auto transition-transform duration-500">
        <div
          className="absolute inset-0 opacity-[0.12] group-hover:opacity-20 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${ACCENT_COLOR}, transparent 70%)`
          }}
        />

        <div className="absolute inset-0 p-10 flex flex-col justify-between z-10">
          <div className="flex justify-between items-start">
            <div className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">
              [N]SKILLS Blueprints
            </div>
            <div className="w-2 h-2 rounded-full bg-[#d97a4a] shadow-[0_0_10px_#d97a4a]" />
          </div>

          <div className="flex flex-col flex-1 justify-center py-6">
            <h3 className="text-3xl font-display font-bold text-white mb-4 leading-tight">
              {template.title}
            </h3>
            <p className="text-forge-text-secondary text-sm leading-relaxed mb-6 opacity-70 line-clamp-3">
              {template.description}
            </p>

            <div className="flex gap-2 flex-wrap">
              {template.nodes.map((node, i) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[10px] font-medium text-white/40 tracking-tight">
                  {node}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleDiscover}
              className="w-full py-4 rounded-xl bg-white text-black font-bold text-xs tracking-wider flex items-center justify-center gap-2 group/btn transition-all active:scale-[0.98] hover:bg-[#efefef] hover:shadow-[0_8px_16px_-4px_rgba(255,255,255,0.2)]"
            >
              Discover Blueprint
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RulerBackground() {
  const points = 70;
  const items = Array.from({ length: points });

  return (
    <div className="absolute top-[60%] -translate-y-[50%] left-0 w-full pointer-events-none overflow-hidden h-[400px]">
      <div className="relative w-full h-full flex items-center justify-center px-[5%]">
        <svg viewBox="0 0 1000 200" className="w-full opacity-[0.1]" preserveAspectRatio="none">
          <path
            d="M 0 120 Q 500 20 1000 120"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeDasharray="2 8"
          />
          {items.map((_, i) => {
            const progress = i / (points - 1);
            const x = progress * 1000;
            const y = 0.0004 * Math.pow(x - 500, 2) + 20;
            const slope = 0.0008 * (x - 500);
            const angle = Math.atan(slope) * (180 / Math.PI);

            return (
              <line
                key={i}
                x1={x}
                y1={y - 6}
                x2={x}
                y2={y + 6}
                stroke="white"
                strokeWidth="0.8"
                transform={`rotate(${angle}, ${x}, ${y})`}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function TemplatesShowcase() {
  const dragX = useMotionValue(0);
  const springX = useSpring(dragX, { stiffness: 60, damping: 20 });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-forge-bg select-none">
      <div className="container mx-auto px-6 relative z-10 pointer-events-none">
        <div className="max-w-xl mb-16">
          <h2 className="text-4xl md:text-7xl font-display font-bold text-white mb-6 tracking-tight">
            Pre-Built{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d97a4a] to-[#a85d38]">
              Blueprints
            </span>
          </h2>
          <p className="text-forge-text-secondary text-lg leading-relaxed max-w-md opacity-80">
            Start from proven architectures. Each blueprint is a complete, interconnected component structure ready to generate and deploy.
          </p>
        </div>
      </div>

      <RulerBackground />

      <div
        className="relative h-[700px] w-full mt-[-40px]"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setIsDragging(false);
        }}
      >
        {/* Cards Layer - Rendered behind the Drag Proxy */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
          {showCaseTemplates.map((template, index) => (
            <TemplateCard
              key={index}
              template={template}
              index={index}
              total={showCaseTemplates.length}
              dragX={springX}
            />
          ))}
        </div>

        {/* Holistic Drag Proxy - Keeps z-index higher and covers the full area */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          onDrag={(_, info) => {
            // Accumulate movement. Since proxy is constrained to 0, it doesn't move,
            // but we get the delta of the mouse/touch.
            dragX.set(dragX.get() + info.delta.x);
          }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          className="absolute inset-0 z-50 cursor-grab active:cursor-grabbing bg-white/0"
        />
      </div>

      <AnimatePresence>
        {isHovering && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isDragging ? 0.9 : 1,
              opacity: 1,
            }}
            exit={{ scale: 0, opacity: 0 }}
            style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
            className="fixed top-0 left-0 pointer-events-none z-[100]"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-8px] rounded-full border border-dashed border-white/20"
              />

              <div className="w-20 h-20 bg-white/10 backdrop-blur-2xl rounded-full border border-white/10 flex flex-col items-center justify-center shadow-2xl">
                <div className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-sm">
                  DRAG
                </div>
                <div className="h-0.5 w-5 bg-white/20 mt-1.5 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ x: [-20, 20] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-full bg-[#d97a4a]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-[#d97a4a]/05 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
    </section>
  );
}
