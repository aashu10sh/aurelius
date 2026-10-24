<script lang="ts">
	import { isActive, p } from 'sv-router/generated';

	// `active` is a function so it re-reads the router state on every render.
	const tabs = [
		{ href: p('/today'), active: () => isActive.startsWith('/today'), label: 'Today', icon: 'sun' },
		{ href: p('/goals'), active: () => isActive.startsWith('/goals'), label: 'Goals', icon: 'target' },
		{ href: p('/progress'), active: () => isActive.startsWith('/progress'), label: 'Progress', icon: 'grid' },
		{ href: p('/journal'), active: () => isActive.startsWith('/journal'), label: 'Journal', icon: 'book' },
	] as const;
</script>

<nav
	aria-label="Main"
	class="grid shrink-0 grid-cols-4 border-t border-nav-border bg-background px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),12px)]"
>
	{#each tabs as tab (tab.href)}
		{@const active = tab.active()}
		<a
			href={tab.href}
			aria-current={active ? 'page' : undefined}
			class="flex h-[49px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium {active
				? 'text-amber-bright'
				: 'text-muted-foreground'}"
		>
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
			>
				{#if tab.icon === 'sun'}
					<circle cx="12" cy="12" r="4" /><path
						d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
					/>
				{:else if tab.icon === 'target'}
					<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
				{:else if tab.icon === 'grid'}
					<rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect
						x="3"
						y="14"
						width="7"
						height="7"
						rx="1.5"
					/><rect x="14" y="14" width="7" height="7" rx="1.5" />
				{:else}
					<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" /><path d="M9 9h6M9 13h4" />
				{/if}
			</svg>
			{tab.label}
		</a>
	{/each}
</nav>
