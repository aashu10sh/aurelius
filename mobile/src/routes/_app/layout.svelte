<script lang="ts">
	import type { Snippet } from 'svelte';
	import TabBar from '$lib/components/app/TabBar.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="mx-auto flex h-dvh max-w-md flex-col bg-background">
	<main class="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-5 pt-[max(env(safe-area-inset-top),56px)] pb-8">
		{@render children()}
	</main>
	<TabBar />
</div>
