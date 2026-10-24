// Sound and haptics switches, per device (Settings → Sound and haptics).
// Storage can be unavailable (private mode), so reads and writes never throw.

const read = (key: string, fallback: boolean) => {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v === '1'
  } catch {
    return fallback
  }
}

const write = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    // Not persisted; the switch still applies for this session.
  }
}

let sound = $state(read('aurelius.sound', true))
let haptics = $state(read('aurelius.haptics', true))

export const feel = {
  get sound() {
    return sound
  },
  set sound(on: boolean) {
    sound = on
    write('aurelius.sound', on)
  },
  get haptics() {
    return haptics
  },
  set haptics(on: boolean) {
    haptics = on
    write('aurelius.haptics', on)
  },
}
