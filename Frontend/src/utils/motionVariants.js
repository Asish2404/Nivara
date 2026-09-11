/**
 * Standardized Motion Design System for NIVARA
 * Calibrated for smooth, calm, intentional product transitions.
 * Standard easing: cubic-bezier(0.22, 1, 0.36, 1)
 */

export const TRANSITION_EASE = [0.22, 1, 0.36, 1]

export const DURATION = {
  micro: 0.16, // 160ms: buttons, active tags, subtle toggles
  standard: 0.28, // 280ms: cards, panels, menus
  major: 0.5, // 500ms: sections, map focus
  cinematic: 0.9, // 900ms: large geographic hero transitions
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.standard, ease: TRANSITION_EASE },
  },
}

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.standard, ease: TRANSITION_EASE },
  },
}

export const slideInRight = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.standard, ease: TRANSITION_EASE },
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: { duration: DURATION.micro, ease: TRANSITION_EASE },
  },
}

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0.05) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
})

export const popIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.micro, ease: TRANSITION_EASE },
  },
}
