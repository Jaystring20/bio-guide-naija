import { Variants } from "framer-motion";

/**
 * Shared motion variants for VeriDIA.
 * All motion is gentle, upward, and reassuring — built for caregivers
 * who may be anxious about a loved one's lab result.
 */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const fadeUpSoft: Variants = {
  hidden: { opacity: 0, y: 8, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export const staggerKids: Variants = {
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerKidsSlow: Variants = {
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export const springPop: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 20, mass: 0.7 },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 220, damping: 22 },
  },
};

export const revealMask: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)", opacity: 0 },
  visible: {
    clipPath: "inset(0 0% 0 0)",
    opacity: 1,
    transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] },
  },
};

export const tabSlide = {
  initial: { opacity: 0, x: 14 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -14, transition: { duration: 0.18, ease: "easeIn" } },
};

export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.18, ease: "easeIn" } },
};
