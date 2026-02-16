import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface StackedCardsOptions {
  container: string | Element;
  cards: string;
  start?: string;
  end?: string;
}

export function createStackedCards({
  container,
  cards,
  start = 'top 60%',
  end = 'bottom 20%',
}: StackedCardsOptions) {
  const cardElements = gsap.utils.toArray<HTMLElement>(cards);

  cardElements.forEach((card, index) => {
    gsap.fromTo(
      card,
      {
        opacity: 0,
        y: 80,
        scale: 0.92,
        rotateX: 8,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start,
          end,
          toggleActions: 'play reverse play reverse',
        },
      }
    );
  });
}
