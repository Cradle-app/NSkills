'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// HSL: 18 76% 58% = #d97a4a
const BRAND_COLOR = 'hsl(18 76% 58%)';

const features = [
  {
    id: '01',
    title: "Visual Design Canvas",
    description: "Drag components from the palette onto the canvas. Configure properties, connect dependencies, and define your architecture visually. No vibecoding chaos—just structured design that AI can enhance.",
  },
  {
    id: '02',
    title: "Rich Component Library",
    description: "Access 50+ production-ready Web3 building blocks: Arbitrum Stylus contracts, Superposition L3 integrations, AI agents, wallet auth, Dune analytics, and more. Each with React hooks, TypeScript SDK, and docs.",
  },
  {
    id: '03',
    title: "Structured Code Generation",
    description: "Click Generate to create a clean, organized codebase. Smart path resolution puts everything in the right place: contracts, hooks, components, routes. Ready for deployment or AI-enhanced iteration.",
  },
  {
    id: '04',
    title: "AI-Powered Workflow",
    description: "Chat with AI to describe your project in natural language. Get instant blueprint suggestions with properly connected components. Continue the conversation to refine and adjust your architecture iteratively.",
  },
  {
    id: '05',
    title: "Direct GitHub Deployment",
    description: "Authenticate with GitHub and push generated code directly to your repositories. Maintain full ownership and control. Generated projects are organized, type-safe, and ready for team collaboration.",
  },
  {
    id: '06',
    title: "Blueprint Import/Export",
    description: "Save your architectures as JSON for version control, backup, or team sharing. Load existing blueprints to continue work or replicate successful patterns across projects. Full portability.",
  }
];

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create a master ScrollTrigger for the pinning
      const st = ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${features.length * 110}%`, // Extra tail room for full visibility
        pin: true,
        scrub: 1.5,
        onUpdate: (self) => {
          const progress = self.progress;
          // Smooth active index mapping
          const index = Math.min(
            features.length - 1,
            Math.floor(progress * (features.length + 0.1))
          );
          setActiveFeature(index);

          // Animate left side upwards
          if (leftContentRef.current) {
            gsap.to(leftContentRef.current, {
              y: -progress * 120, // Move left content up to clear space
              duration: 0.6,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          }

          // Shifting the content stack up to ensure bottom features are seen
          if (scrollContentRef.current) {
            gsap.to(scrollContentRef.current, {
              y: -progress * 300, // Significant shift to bring bottom cards up
              duration: 0.6,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          }
        }
      });
    }, containerRef.current!);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-[#050505] text-white overflow-hidden selection:bg-white selection:text-black font-sans"
    >
      <div className="container mx-auto min-h-screen relative px-6 md:px-12 py-24 flex flex-col lg:flex-row gap-16 lg:gap-24">

        {/* Left Column: Title Content */}
        <div ref={leftContentRef} className="lg:w-5/12 flex flex-col justify-between py-12">
          <div className="lg:sticky lg:top-24">
            <h2 className="text-6xl md:text-8xl font-display font-bold tracking-tighter leading-[0.85] text-white mb-10">
              Why<br />[N]Skills
            </h2>

            <p className="text-xl md:text-2xl text-white/50 leading-relaxed max-w-sm font-medium">
              Skip the chaos of vibecoding from scratch. Design your foundation visually, generate structured code, then enhance with Cursor or Copilot.
            </p>
          </div>
        </div>

        {/* Right Column: Scroll-Controlled Stack */}
        {/* Added bottom padding to ensure the last item is never cut off */}
        <div ref={scrollContentRef} className="lg:w-7/12 flex flex-col justify-center relative pr-4">
          <div className="w-full space-y-4">
            {features.map((feature, index) => {
              const isActive = activeFeature === index;

              return (
                <div
                  key={index}
                  className={`group transition-all duration-700 border-t border-white/10 ${isActive ? 'py-10' : 'py-6 opacity-40 hover:opacity-100'
                    }`}
                >
                  {/* Item Header */}
                  <div className="flex items-center gap-6">
                    <span className={`text-[12px] font-mono transition-colors duration-500 ${isActive ? 'text-white' : 'text-white/40'}`}>
                      ● {feature.id}
                    </span>
                    <h3 className={`text-2xl md:text-3xl font-display font-bold tracking-tight transition-all duration-500 ${isActive ? 'text-white scale-[1.02] origin-left' : 'text-white/60'
                      }`}>
                      {feature.title.toUpperCase()}
                    </h3>
                  </div>

                  {/* Expanded Card Content */}
                  <div
                    className={`overflow-hidden transition-all duration-[900ms] cubic-bezier(0.16, 1, 0.3, 1) ${isActive ? 'max-h-[700px] mt-8 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div
                      className="rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
                      style={{
                        backgroundColor: BRAND_COLOR,
                        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)`
                      }}
                    >
                      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] -mr-32 -mt-32 rounded-lg" />

                      <p className="text-xl md:text-2xl font-display font-bold tracking-tight text-white leading-snug mb-10 relative z-10">
                        {feature.description}
                      </p>

                      <div className="flex justify-between items-end relative z-10">
                        <div className="h-0.5 w-32 bg-white/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white"
                            style={{
                              width: isActive ? '100%' : '0%',
                              transition: isActive ? 'width 3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] tracking-widest text-white/80 uppercase bg-black/20 px-3 py-1 rounded-full">
                          System Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[hsl(18_76%_58%)]/05 blur-[150px] opacity-30" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[hsl(18_76%_58%)]/05 blur-[150px] opacity-30" />
      </div>
    </section>
  );
}
