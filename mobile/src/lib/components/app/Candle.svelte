<script lang="ts">
	// The Aurelius asterisk as a small candle: unlit (faint) until the day's
	// first tick, then it catches and flickers for the rest of the day.
	// `ignite` changes on the tap that lights it, which plays the flare.
	let { lit, ignite = 0, size = 16 }: { lit: boolean; ignite?: number; size?: number } = $props();
</script>

{#key ignite}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		aria-hidden="true"
		class="shrink-0 origin-[50%_70%] {lit ? 'text-amber-bright' : 'text-faint'} {lit && ignite > 0 ? 'animate-ignite' : ''}"
		style:filter={lit ? 'drop-shadow(0 0 4px color-mix(in oklab, var(--amber) 60%, transparent))' : undefined}
	>
		<g class="origin-[50%_70%] {lit ? 'animate-flicker' : ''}" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
			<path d="M12 4.5v15" />
			<path d="M5.5 8.25l13 7.5" />
			<path d="M18.5 8.25l-13 7.5" />
		</g>
	</svg>
{/key}
