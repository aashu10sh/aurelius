<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { Button } from '$lib/components/ui/button';
	import { haptic } from '$lib/feel/haptics';
	import { duration } from '$lib/feel/motion';
	import { play } from '$lib/feel/sound';

	// Full-screen moment when a tick crosses into a new level: a laurel draws
	// itself around the number. Dismissed with Continue, a tap outside, or Esc.
	let { level, onclose }: { level: number; onclose: () => void } = $props();

	let button = $state<HTMLElement | null>(null);
	$effect(() => {
		haptic('celebrate');
		play('levelUp');
		button?.focus();
	});

	// Leaves along each branch: [x, y, rotation°], bottom to top.
	const LEAVES = [
		[44, 128, -150],
		[34, 108, -165],
		[30, 86, 180],
		[32, 64, 165],
		[40, 44, 150],
		[52, 28, 135],
	] as const;
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div
	role="dialog"
	aria-modal="true"
	aria-labelledby="level-up-title"
	tabindex="-1"
	class="fixed inset-0 z-50 flex items-center justify-center bg-background/85 px-8 backdrop-blur-sm"
	transition:fade={{ duration: duration(200) }}
	onclick={(e) => e.target === e.currentTarget && onclose()}
	onkeydown={() => {}}
>
	<div class="flex w-full max-w-xs flex-col items-center gap-6 text-center" in:scale={{ duration: duration(420), start: 0.85, easing: backOut }}>
		<div class="relative flex size-48 items-center justify-center">
			<svg viewBox="0 0 200 160" class="absolute inset-0 size-full text-amber" aria-hidden="true">
				{#each [false, true] as mirrored (mirrored)}
					<g transform={mirrored ? 'translate(200 0) scale(-1 1)' : undefined}>
						<path d="M62 150 C 30 120, 22 70, 58 22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" pathLength="1" class="laurel-stem" />
						{#each LEAVES as [x, y, r], i (i)}
							<g transform="translate({x} {y}) rotate({r})">
								<path d="M0 0 C 5 -6, 15 -7, 20 0 C 15 7, 5 6, 0 0 Z" fill="currentColor" class="laurel-leaf" style:animation-delay="{260 + i * 70}ms" />
							</g>
						{/each}
					</g>
				{/each}
			</svg>
			<span class="font-mono text-[64px] leading-none font-medium text-amber-bright">{level}</span>
		</div>
		<div class="flex flex-col gap-2">
			<div class="eyebrow">Level up</div>
			<h2 id="level-up-title" class="m-0 text-[28px] font-semibold tracking-tight">You reached level {level}</h2>
			<p class="m-0 text-[15px] text-muted-foreground">Small days, kept. That’s how it adds up.</p>
		</div>
		<Button bind:ref={button} size="block" onclick={onclose}>Continue</Button>
	</div>
</div>

<style>
	.laurel-stem {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: draw 700ms 80ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}
	.laurel-leaf {
		transform-box: fill-box;
		transform-origin: 0 50%;
		opacity: 0;
		transform: scale(0);
		animation: leaf 380ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}
	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes leaf {
		to {
			opacity: 0.9;
			transform: scale(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.laurel-stem {
			stroke-dashoffset: 0;
		}
		.laurel-leaf {
			opacity: 0.9;
			transform: scale(1);
		}
	}
</style>
