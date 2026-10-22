<script lang="ts">
	import type { Snippet } from 'svelte';

	// 44px row with a back/close link on the left and an optional action on the right.
	let {
		href,
		icon = 'back',
		label = icon === 'back' ? 'Back' : 'Close',
		right,
	}: { href: string; icon?: 'back' | 'close'; label?: string; right?: Snippet } = $props();
</script>

<div class="flex h-11 items-center justify-between">
	<a {href} aria-label={label} class="-ml-3 flex size-11 items-center justify-center text-foreground">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			{#if icon === 'back'}<path d="M15 6l-6 6 6 6" />{:else}<path d="M6 6l12 12M18 6 6 18" />{/if}
		</svg>
	</a>
	{@render right?.()}
</div>
