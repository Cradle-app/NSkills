import Image from 'next/image';
import logo from '@/assets/logo.png';

/**
 * Route-level loading UI (App Router).
 * Renders as a Server Component so it appears immediately while the page segment loads.
 * Uses CSS animations (see tailwind.config.ts) so no client JS is required.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[hsl(var(--color-bg-base))] overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[hsl(var(--color-accent-primary)/0.03)] blur-[120px] rounded-full" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[hsl(var(--color-accent-secondary)/0.02)] blur-[100px] rounded-full" />

      <div className="relative flex flex-col items-center gap-10 animate-loading-in">
        {/* Central Logo Animation */}
        <div className="relative">
          {/* Pulsing Aura */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--color-accent-primary)/0.15)] to-[hsl(var(--color-accent-secondary)/0.15)] blur-3xl rounded-full scale-150 animate-loading-aura"
            aria-hidden
          />

          {/* Logo with Floating Animation */}
          <div className="relative z-10 p-4 animate-loading-float">
            <div className="relative w-32 md:w-40 filter drop-shadow-[0_0_30px_rgba(var(--color-accent-primary),0.2)]">
              <Image
                src={logo}
                alt="Logo"
                width={160}
                height={160}
                className="w-full h-auto object-contain brightness-110 contrast-105"
                priority
              />
            </div>
          </div>
        </div>

        {/* Professional Progress Segment */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-[2px] w-32 bg-[hsl(var(--color-border-subtle))] rounded-full overflow-hidden relative">
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-transparent via-[hsl(var(--color-accent-primary))] to-transparent w-full animate-loading-progress"
              aria-hidden
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs font-semibold tracking-[0.3em] uppercase text-[hsl(var(--color-text-secondary))] opacity-80 animate-loading-text">
              Initializing Workspace
            </span>
          </div>
        </div>
      </div>

      {/* Modern Grid Background Overlay (Subtle) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--color-text-primary)) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Decorative Edge Lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--color-border-subtle)/0.3)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--color-border-subtle)/0.3)] to-transparent" />
    </div>
  );
}
