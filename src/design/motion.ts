import { type Variants } from 'framer-motion';

export const fadeLiftVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const cardHoverTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const interactiveButtonTap = {
  scale: 0.97,
};
