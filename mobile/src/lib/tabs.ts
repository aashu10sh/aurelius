import { getContext, setContext } from 'svelte'

// Whether the screen is the tab on show. Tab screens stay mounted while hidden
// (routes/_app/layout.svelte); their queries pause meanwhile and catch up when
// shown again. Screens outside the tab bar are always on show.
const key = Symbol('tab-shown')

export const provideTabShown = (shown: () => boolean) => setContext(key, shown)

// Call during component setup, like any getContext.
export const tabShown = (): (() => boolean) => getContext<() => boolean>(key) ?? (() => true)
