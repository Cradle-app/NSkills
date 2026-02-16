import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScaleOnScrollOptions {
  trigger: string | Element;
  target: string | Element;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  scaleFrom?: number;
  scaleTo?: number;
  borderRadiusFrom?: string;
  borderRadiusTo?: string;
}

export function createScaleOnScroll({
  trigger,
  target,
  start = 'top top',
  end = 'bottom top',
  scrub = 1,
  scaleFrom = 0.7,
  scaleTo = 1,
  borderRadiusFrom = '24px',
  borderRadiusTo = '0px',
}: ScaleOnScrollOptions) {
  return gsap.fromTo(
    target,
    {
      scale: scaleFrom,
      borderRadius: borderRadiusFrom,
    },
    {
      scale: scaleTo,
      borderRadius: borderRadiusTo,
      ease: 'none',
      scrollTrigger: {
        trigger,
        start,
        end,
        scrub,
        pin: false,
      },
    }
  );
}
