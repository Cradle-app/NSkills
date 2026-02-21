'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

import ArbitrumLogo from '@/assets/blocks/arbitrum.svg';
import BnbLogo from '@/assets/blocks/BNB Chain.png';
import StylusLogo from '@/assets/blocks/stylus.svg';
import GithubLogo from '@/assets/blocks/github.png';
import TelegramLogo from '@/assets/blocks/Telegram.jpg';
import UniswapLogo from '@/assets/blocks/Uniswap.svg';
import ChainlinkLogo from '@/assets/blocks/Chainlink.svg';
import AaveLogo from '@/assets/blocks/Aave.svg';
import IpfsLogo from '@/assets/blocks/Ipfs.svg';
import WalletLogo from '@/assets/blocks/Wallet.svg';
import DuneLogo from '@/assets/blocks/dune.png';
import CompoundLogo from '@/assets/blocks/Compound.svg';
import PythLogo from '@/assets/blocks/Pyth.svg';
import SuperpositionLogo from '@/assets/blocks/superposition.png';
import AixbtLogo from '@/assets/blocks/aixbt.png';
import AuditwareLogo from '@/assets/blocks/auditware.png';
import MaxxiLogo from '@/assets/blocks/MaxxitLogo.png';
gsap.registerPlugin(ScrollTrigger);

const integrations = [
  // Native / Core
  { name: 'Arbitrum', icon: ArbitrumLogo },
  { name: 'BNB Chain', icon: BnbLogo },
  { name: 'Stylus', icon: StylusLogo },
  { name: 'Superposition', icon: SuperpositionLogo },
  { name: 'Aixbt', icon: AixbtLogo },
  { name: 'Auditware', icon: AuditwareLogo },
  { name: 'GitHub', icon: GithubLogo },
  { name: 'Telegram', icon: TelegramLogo },

  // Ecosystem Protocols
  { name: 'Uniswap', icon: UniswapLogo },
  { name: 'Chainlink', icon: ChainlinkLogo },
  { name: 'Aave', icon: AaveLogo },
  { name: 'Compound', icon: CompoundLogo },
  { name: 'Pyth', icon: PythLogo },
  { name: 'Dune', icon: DuneLogo },
  { name: 'IPFS', icon: IpfsLogo },
  { name: 'Wallet', icon: WalletLogo },
  { name: 'Maxxit', icon: MaxxiLogo }
];

function CarouselRow({ items, direction = 'left', speed = 30 }: {
  items: typeof integrations;
  direction?: 'left' | 'right';
  speed?: number;
}) {
  return (
    <div className="relative overflow-hidden group">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 z-10 bg-gradient-to-r from-forge-bg to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 z-10 bg-gradient-to-l from-forge-bg to-transparent pointer-events-none" />

      <div
        className="flex gap-4 md:gap-6 group-hover:[animation-play-state:paused]"
        style={{
          animation: `${direction === 'left' ? 'carousel-scroll-left' : 'carousel-scroll-right'} ${speed}s linear infinite`,
          width: 'max-content',
        }}
      >
        {/* Duplicate items for seamless loop */}
        {[...items, ...items, ...items].map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center px-4 py-3 md:px-8 md:py-6 rounded-2xl border border-transparent hover:border-[#d97a4a]/30 hover:bg-[#d97a4a]/5 transition-all duration-300 cursor-default group/item flex-shrink-0"
            style={{ minWidth: '100px' }}
          >
            <div className="w-10 h-10 md:w-12 md:h-12 relative mb-2 md:mb-3 opacity-50 group-hover/item:opacity-100 transition-all duration-300 group-hover/item:scale-110 grayscale group-hover/item:grayscale-0">
              <Image
                src={item.icon}
                alt={item.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="text-[10px] md:text-xs font-medium text-forge-text-secondary group-hover/item:text-white transition-colors duration-300 whitespace-nowrap">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IntegrationGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: titleRef.current,
              start: 'top 85%',
              toggleActions: 'play reverse play reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Split items into two rows
  const row1 = integrations.slice(0, 8);
  const row2 = integrations.slice(8);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-forge-border/50 to-transparent" />

      <div className="container mx-auto px-6 mb-8 sm:mb-12">
        <h2
          ref={titleRef}
          className="text-center text-base sm:text-lg md:text-xl font-display font-semibold text-forge-text-secondary uppercase tracking-[0.2em] mb-4"
        >
          Integrated with the Best of Web3
        </h2>
      </div>

      {/* Infinite carousel rows */}
      <div className="space-y-4">
        <CarouselRow items={row1} direction="left" speed={35} />
        <CarouselRow items={row2} direction="right" speed={40} />
      </div>
    </section>
  );
}
