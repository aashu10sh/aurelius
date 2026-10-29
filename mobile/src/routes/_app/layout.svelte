<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { preload, route } from 'sv-router/generated';
	import { prefetchTabs } from '$lib/api/queries';
	import TabBar from '$lib/components/app/TabBar.svelte';
	import TabPane from '$lib/components/app/TabPane.svelte';
	import { rise } from '$lib/feel/transitions';
	import { pinViewport } from '$lib/viewport';
	import GoalsTab from './goals/index.svelte';
	import JournalTab from './journal/index.svelte';
	import ProgressTab from './progress.svelte';
	import TodayTab from './today.svelte';

	let { children }: { children: Snippet } = $props();

	// The tab roots stay mounted once visited, like a native tab bar: switching
	// back is instant and keeps the screen's state and scroll position. Only
	// pushed screens (goal detail, settings, …) come and go through `children`.
	const tabs = [
		{ path: '/today', screen: TodayTab },
		{ path: '/goals', screen: GoalsTab },
		{ path: '/progress', screen: ProgressTab },
		{ path: '/journal', screen: JournalTab },
	];

	const tab = $derived(tabs.find((t) => t.path === route.pathname.replace(/\/$/, ''))?.path ?? null);

	let visited = $state<Record<string, true>>({});
	$effect.pre(() => {
		if (tab) visited[tab] = true;
	});

	onMount(() => {
		void prefetchTabs();
		// Pushed screens are split out of the startup bundle (*.lazy.svelte);
		// load their code once the app is idle so opening one never waits on it.
		const idle = window.requestIdleCallback ?? ((run: () => void) => setTimeout(run, 1000));
		idle(() => {
			for (const path of ['/goals/new', '/goals/:id', '/settings', '/journal/week'] as const) void preload(path);
		});
		return pinViewport();
	});

	// Every screen fills the area above the tab bar; the tab roots are stacked there.
	const scroller = 'absolute inset-0 flex flex-col gap-8 overflow-y-auto overscroll-y-contain px-5 pt-[max(env(safe-area-inset-top),56px)] pb-8';
</script>

<!-- Pinned to the screen, so the page itself never scrolls or rubber-bands. In an
     installed app dvh comes up short on iOS 26 (no toolbar to track), lvh doesn't. -->
<div class="fixed inset-x-0 top-0 mx-auto flex h-dvh max-w-md flex-col bg-background standalone:h-lvh">
	<div class="relative min-h-0 flex-1">
		{#each tabs as t (t.path)}
			{#if visited[t.path]}
				<TabPane shown={tab === t.path} class={scroller}>
					<t.screen />
				</TabPane>
			{/if}
		{/each}
		{#if !tab}
			<!-- Pushed screens arrive with a short fade and rise, scrolled to the top. -->
			{#key route.pathname}
				<main class={scroller}>
					<div class="flex flex-col gap-8" in:rise={{ y: 4 }}>
						{@render children()}
					</div>
				</main>
			{/key}
		{/if}
	</div>
	<TabBar />
</div>
