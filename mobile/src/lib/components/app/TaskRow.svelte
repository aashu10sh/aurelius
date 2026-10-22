<script lang="ts">
	import type { TodayResponse } from 'backend/contract';
	import { cadenceProgress } from '$lib/format';

	type Task = TodayResponse['goals'][number]['tasks'][number];
	let { task, ontoggle }: { task: Task; ontoggle: () => void } = $props();
</script>

<button
	type="button"
	onclick={ontoggle}
	aria-pressed={task.doneToday}
	class="flex min-h-[60px] w-full items-center gap-3 bg-transparent px-4 py-3 text-left transition-colors active:bg-accent/40"
>
	{#if task.doneToday}
		<span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="text-primary-foreground"><path d="M5 12.5 10 17.5 19 7" /></svg>
		</span>
	{:else}
		<span class="size-6 shrink-0 rounded-full border-[1.5px] border-faint"></span>
	{/if}
	<span class="flex min-w-0 flex-1 flex-col gap-1">
		<span class="text-[15px] font-medium">{task.title}</span>
		<span class="font-mono text-xs text-muted-foreground">{cadenceProgress(task.cadence, task.periodDone)}</span>
	</span>
	<span class="font-mono text-[13px] {task.doneToday ? 'text-amber-bright' : 'text-muted-foreground'}">+{task.xp}</span>
</button>
