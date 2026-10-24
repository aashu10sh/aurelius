<script lang="ts">
	// Sans "A" with an amber asterisk. `animated`: the A settles in, then the
	// asterisk catches like a candle and keeps a slow glow (Welcome).
	let { size = 88, animated = false }: { size?: number; animated?: boolean } = $props();
</script>

<div role="img" aria-label="Aurelius" class="flex items-start gap-0.5 leading-none">
	<span class="font-semibold tracking-tight text-foreground {animated ? 'animate-rise-in' : ''}" style:font-size="{size}px">A</span>
	<span
		class="inline-block origin-center font-semibold text-amber"
		style:font-size="{size * 0.64}px"
		style:margin-top="-{size * 0.05}px"
		style:animation={animated ? 'ignite 900ms 350ms var(--ease-out-soft) backwards, breathe 4.5s 1.3s ease-in-out infinite' : undefined}>*</span
	>
</div>
