<script lang="ts">
	import { isActive, p } from 'sv-router/generated';
	import { haptic } from '$lib/feel/haptics';

	// `active` is a function so it re-reads the router state on every render.
	const tabs = [
		{ href: p('/today'), active: () => isActive.startsWith('/today'), label: 'Today', icon: 'sun' },
		{ href: p('/goals'), active: () => isActive.startsWith('/goals'), label: 'Goals', icon: 'target' },
		{ href: p('/progress'), active: () => isActive.startsWith('/progress'), label: 'Progress', icon: 'grid' },
		{ href: p('/journal'), active: () => isActive.startsWith('/journal'), label: 'Journal', icon: 'book' },
	] as const;

	const current = $derived(tabs.findIndex((t) => t.active()));

	// Bumped per tab on the tap that selects it, replaying that icon's animation.
	let played = $state<Record<string, number>>({});

	function select(href: string, active: boolean) {
		if (active) return;
		haptic('select');
		played[href] = (played[href] ?? 0) + 1;
	}
</script>

<nav
	aria-label="Main"
	class="relative grid shrink-0 grid-cols-4 border-t border-nav-border bg-background px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),12px)]"
>
	<!-- A short amber line on the bar's top edge that glides to the active tab. -->
	{#if current >= 0}
		<span
			aria-hidden="true"
			class="pointer-events-none absolute -top-px left-2 h-0.5 w-[calc((100%-1rem)/4)] transition-transform duration-300 ease-(--ease-spring)"
			style:transform="translateX({current * 100}%)"
		>
			<span class="mx-auto block h-full w-6 rounded-full bg-amber-bright"></span>
		</span>
	{/if}

	{#each tabs as tab (tab.href)}
		{@const active = tab.active()}
		<a
			href={tab.href}
			aria-current={active ? 'page' : undefined}
			onclick={() => select(tab.href, active)}
			class="group flex h-[49px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors duration-200 {active
				? 'text-amber-bright'
				: 'text-muted-foreground'}"
		>
			{#key played[tab.href]}
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.75"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					class="icon-{tab.icon} transition-transform duration-150 group-active:scale-90 {played[tab.href] ? 'played' : ''}"
				>
					{#if tab.icon === 'sun'}
						<circle cx="12" cy="12" r="4" class="core" /><path
							class="rays"
							d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
						/>
					{:else if tab.icon === 'target'}
						<circle cx="12" cy="12" r="9" class="ring-outer" /><circle cx="12" cy="12" r="5" class="ring-inner" /><circle cx="12" cy="12" r="1" class="bull" />
					{:else if tab.icon === 'grid'}
						<rect x="3" y="3" width="7" height="7" rx="1.5" class="cell" /><rect x="14" y="3" width="7" height="7" rx="1.5" class="cell" /><rect
							x="3"
							y="14"
							width="7"
							height="7"
							rx="1.5"
							class="cell"
						/><rect x="14" y="14" width="7" height="7" rx="1.5" class="cell" />
					{:else}
						<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" class="cover" /><path d="M9 9h6M9 13h4" class="lines" />
					{/if}
				</svg>
			{/key}
			{tab.label}
		</a>
	{/each}
</nav>

<style>
	/* Each icon's own small moment when its tab is chosen. */
	svg :global(*) {
		transform-box: fill-box;
		transform-origin: center;
	}
	.icon-sun.played .rays {
		transform-box: view-box;
		animation: rays 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.icon-sun.played .core {
		animation: pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.icon-target.played .ring-outer {
		animation: pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.icon-target.played .ring-inner {
		animation: pop 420ms 70ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.icon-target.played .bull {
		animation: pop 420ms 140ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.icon-grid.played .cell {
		animation: pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
	}
	.icon-grid.played .cell:nth-child(2) {
		animation-delay: 50ms;
	}
	.icon-grid.played .cell:nth-child(3) {
		animation-delay: 100ms;
	}
	.icon-grid.played .cell:nth-child(4) {
		animation-delay: 150ms;
	}
	.icon-book.played .cover {
		transform-origin: left center;
		animation: open 460ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.icon-book.played .lines {
		animation: lines 460ms 80ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
	}

	@keyframes rays {
		from {
			transform: rotate(-45deg) scale(0.8);
		}
		to {
			transform: rotate(0) scale(1);
		}
	}
	@keyframes pop {
		0% {
			transform: scale(0.7);
		}
		60% {
			transform: scale(1.12);
		}
		100% {
			transform: scale(1);
		}
	}
	@keyframes open {
		0% {
			transform: perspective(40px) rotateY(-35deg);
		}
		100% {
			transform: perspective(40px) rotateY(0);
		}
	}
	@keyframes lines {
		from {
			opacity: 0;
			transform: translateX(-3px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
