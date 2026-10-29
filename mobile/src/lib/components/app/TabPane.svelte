<script lang="ts">
	import type { Snippet } from 'svelte';
	import { provideTabShown } from '$lib/tabs';

	// One tab's scroll area. It stays mounted and laid out while another tab is
	// on show, only invisible and inert, so the browser keeps its scroll offset
	// (display: none would reset it to the top).
	let { shown, class: className, children }: { shown: boolean; class: string; children: Snippet } = $props();

	provideTabShown(() => shown);
</script>

<main inert={!shown} class="{className} {shown ? '' : 'invisible'}">
	{@render children()}
</main>
