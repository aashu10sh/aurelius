<script lang="ts">
	// One segment per milestone, filled when done.
	let { done, total }: { done: number; total: number } = $props();
</script>

<div
	role="img"
	aria-label="{done} of {total} milestones done"
	class="grid gap-1"
	style:grid-template-columns="repeat({total}, minmax(0, 1fr))"
>
	{#each { length: total }, i}
		<span class="h-1.5 rounded-full transition-colors duration-300 {i < done ? 'bg-amber' : 'bg-track'}"></span>
	{/each}
</div>
