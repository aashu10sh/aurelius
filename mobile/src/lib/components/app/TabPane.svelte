<script lang="ts">
	import type { Snippet } from 'svelte';
	import { provideTabShown } from '$lib/tabs';

	// One tab's scroll area. It stays mounted while another tab is on show, and
	// puts its scroll offset back on return (hidden scrollers can lose it).
	let { shown, class: className, children }: { shown: boolean; class: string; children: Snippet } = $props();

	provideTabShown(() => shown);

	let scroller: HTMLElement;
	let offset = 0;
	$effect(() => {
		if (shown) scroller.scrollTop = offset;
	});
</script>

<main bind:this={scroller} hidden={!shown} onscroll={() => shown && (offset = scroller.scrollTop)} class={className}>
	{@render children()}
</main>
