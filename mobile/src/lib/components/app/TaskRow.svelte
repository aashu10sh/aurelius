<script lang="ts">
	import type { TodayResponse } from 'backend/contract';
	import { cadenceProgress } from '$lib/format';

	type Task = TodayResponse['goals'][number]['tasks'][number];
	let { task, ontoggle }: { task: Task; ontoggle: () => void } = $props();

	// Bumped on each tap that ticks the task: replays the burst. Data that
	// arrives already ticked (load, refetch) only gets the quiet fill.
	let burst = $state(0);
	const celebrating = $derived(burst > 0 && task.doneToday);

	// Six sparks around the circle.
	const SPARKS = Array.from({ length: 6 }, (_, i) => {
		const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
		return { dx: `${Math.cos(angle) * 17}px`, dy: `${Math.sin(angle) * 17}px` };
	});

	function onclick() {
		if (!task.doneToday) burst++;
		ontoggle();
	}
</script>

<button
	type="button"
	{onclick}
	aria-pressed={task.doneToday}
	class="group flex min-h-[60px] w-full items-center gap-3 bg-transparent px-4 py-3 text-left transition-colors active:bg-accent/40"
>
	<span class="relative flex size-6 shrink-0 items-center justify-center transition-transform duration-150 group-active:scale-90">
		<span class="absolute inset-0 rounded-full border-[1.5px] border-faint"></span>
		{#key burst}
			<span
				class="absolute inset-0 rounded-full bg-primary transition-[scale,opacity] duration-200 ease-(--ease-out-soft) {task.doneToday
					? 'scale-100 opacity-100'
					: 'scale-50 opacity-0'} {celebrating ? 'animate-check-pop' : ''}"
			></span>
			{#if celebrating}
				<span class="pointer-events-none absolute inset-0 animate-ring rounded-full border-2 border-amber"></span>
				{#each SPARKS as s, i (i)}
					<span
						class="pointer-events-none absolute top-1/2 left-1/2 size-[5px] animate-spark rounded-full bg-amber-bright"
						style:--dx={s.dx}
						style:--dy={s.dy}
					></span>
				{/each}
			{/if}
		{/key}
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="relative text-primary-foreground">
			<path
				d="M5 12.5 10 17.5 19 7"
				pathLength="1"
				stroke-dasharray="1"
				class="transition-[stroke-dashoffset] duration-200 ease-(--ease-out-soft) {task.doneToday ? 'delay-75' : ''}"
				style:stroke-dashoffset={task.doneToday ? 0 : 1}
			/>
		</svg>
	</span>
	<span class="flex min-w-0 flex-1 flex-col gap-1">
		<span class="text-[15px] font-medium">{task.title}</span>
		<span class="font-mono text-xs text-muted-foreground">{cadenceProgress(task.cadence, task.periodDone)}</span>
	</span>
	<span class="relative font-mono text-[13px] transition-colors duration-200 {task.doneToday ? 'text-amber-bright' : 'text-muted-foreground'}">
		+{task.xp}
		{#key burst}
			{#if celebrating}
				<span aria-hidden="true" class="pointer-events-none absolute right-0 bottom-full animate-float-up font-medium text-amber-bright">+{task.xp}</span>
			{/if}
		{/key}
	</span>
</button>
