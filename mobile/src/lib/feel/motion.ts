// Shared timings for script-driven motion (CSS keyframes live in app.css).
export const DURATION = { fast: 150, base: 240, slow: 420 } as const

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Duration to use right now: 0 when the OS asks for reduced motion.
export const duration = (ms: number) => (reducedMotion() ? 0 : ms)
