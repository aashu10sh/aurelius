<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';

	// Placeholder while a screen's data loads, or a retry when it failed.
	let { error, onretry }: { error?: Error | null; onretry?: () => void } = $props();
</script>

{#if error}
	<div class="flex flex-col items-start gap-3 rounded-2xl bg-card p-4">
		<p class="m-0 text-[15px] text-soft">{error.message}</p>
		{#if onretry}<Button variant="secondary" onclick={onretry}>Try again</Button>{/if}
	</div>
{:else}
	<!-- Fades in after a beat, so quick loads never flash a placeholder. -->
	<div class="flex animate-fade-in flex-col gap-4 [animation-delay:180ms]" aria-busy="true" aria-label="Loading">
		<Skeleton class="h-20 rounded-2xl bg-card" />
		<Skeleton class="h-40 rounded-2xl bg-card" />
		<Skeleton class="h-40 rounded-2xl bg-card" />
	</div>
{/if}
