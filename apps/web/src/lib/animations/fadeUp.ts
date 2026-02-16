import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FadeUpOptions {
  trigger: string | Element;
  targets: string | Element | Element[];
  start?: string;
  end?: string;
  stagger?: number;
  y?: number;
  duration?: number;
  delay?: number;
}

export function createFadeUp({
  trigger,
  targets,
  start = 'top 85%',
  end = 'top 20%',
  stagger = 0.15,
  y = 60,
  duration = 1,
  delay = 0,
}: FadeUpOptions) {
  return gsap.fromTo(
    targets,
    {
      opacity: 0,
      y,
    },
    {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger,
        start,
        end,
        toggleActions: 'play reverse play reverse',
      },
    }
  );
}
