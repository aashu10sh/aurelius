import { feel } from './prefs.svelte'

// Named vibrations, so every screen feels the same. Only for meaningful
// moments (ticks, selections, celebrations), never every tap.
export type Haptic = 'tap' | 'select' | 'success' | 'celebrate'

const PATTERNS: Record<Haptic, number | number[]> = {
  tap: 8,
  select: 10,
  success: [12, 60, 24],
  celebrate: [16, 70, 16, 70, 36],
}

// iOS Safari has no Vibration API, but since iOS 18 toggling a native switch
// control plays a system haptic. Clicking a hidden one inside a tap borrows
// it: one light tick, no patterns. Elsewhere this does nothing.
const iosTick = () => {
  const label = document.createElement('label')
  label.ariaHidden = 'true'
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.append(input)
  document.head.append(label)
  label.click()
  label.remove()
}

// Call from inside the user's tap: browsers ignore vibration otherwise.
export const haptic = (kind: Haptic) => {
  if (!feel.haptics) return
  if ('vibrate' in navigator) navigator.vibrate(PATTERNS[kind])
  else iosTick()
}
