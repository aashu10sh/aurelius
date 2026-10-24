import { feel } from './prefs.svelte'

// Small synthesized chimes (no audio files): a soft sine with a quieter
// octave partial, like a little bell. Kept quiet; they accompany, not announce.
export type Sound = 'tick' | 'untick' | 'first' | 'goal' | 'levelUp'

// Notes in Hz, with when each starts (s) and how long it rings (s).
const NOTES: Record<Sound, [freq: number, at: number, length: number][]> = {
  tick: [
    [784, 0, 0.18], // G5
    [1175, 0.06, 0.28], // D6
  ],
  untick: [[523, 0, 0.14]], // C5
  first: [
    [1047, 0, 0.3], // C6
    [1319, 0.08, 0.32], // E6
    [1568, 0.16, 0.5], // G6: the candle catching
  ],
  goal: [
    [784, 0, 0.2],
    [1175, 0.06, 0.24],
    [1568, 0.14, 0.45],
  ],
  levelUp: [
    [523, 0, 0.4], // C5
    [659, 0.1, 0.4], // E5
    [784, 0.2, 0.4], // G5
    [1047, 0.32, 0.9], // C6
    [1319, 0.32, 0.9], // E6
  ],
}

let ctx: AudioContext | null = null

const audio = () => {
  if (!ctx) {
    // iOS: mix with the user's music and respect the silent switch.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'ambient'
    ctx = new AudioContext()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

const bell = (c: AudioContext, freq: number, start: number, length: number) => {
  for (const [multiple, level] of [
    [1, 0.07],
    [2, 0.018],
  ] as const) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq * multiple
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(level, start + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length / multiple)
    osc.connect(gain).connect(c.destination)
    osc.start(start)
    osc.stop(start + length + 0.05)
  }
}

// The first call must come from a tap, which unlocks audio for the page.
export const play = (sound: Sound) => {
  if (!feel.sound) return
  try {
    const c = audio()
    const now = c.currentTime + 0.01
    for (const [freq, at, length] of NOTES[sound]) bell(c, freq, now + at, length)
  } catch {
    // No Web Audio: stay silent.
  }
}
