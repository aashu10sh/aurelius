import { cubicOut } from 'svelte/easing'
import type { TransitionConfig } from 'svelte/transition'
import { duration } from './motion'

// A short fade with a few pixels of rise: how screens and list items arrive.
export const rise = (_node: Element, { delay = 0, y = 6 }: { delay?: number; y?: number } = {}): TransitionConfig => ({
  delay: duration(delay),
  duration: duration(240),
  easing: cubicOut,
  css: (t, u) => `opacity: ${t}; transform: translateY(${u * y}px)`,
})

// Delay for the i-th item of a list: quick, and capped so long lists don't drag.
export const stagger = (i: number, step = 35) => Math.min(i, 8) * step
