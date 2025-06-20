import { Transition, Variants } from "framer-motion";

export const iosTransition: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 40,
  mass: 1,
  duration: 0.45,
  ease: [0.4, 0, 0.2, 1], // iOS-like cubic bezier
};

export const fadeInOut: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: iosTransition },
  exit: { opacity: 0, transition: iosTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: iosTransition },
  exit: { opacity: 0, scale: 0.98, transition: iosTransition },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: iosTransition },
  exit: { opacity: 0, y: 40, transition: iosTransition },
}; 