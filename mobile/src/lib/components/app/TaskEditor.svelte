<script module lang="ts">
	import type { CadenceType, Effort } from 'backend/contract';

	export type TaskDraft = { title: string; effort: Effort; cadenceType: CadenceType; count: number };

	export const XP: Record<Effort, number> = { light: 10, medium: 20, heavy: 30 };

	export const blankTask = (): TaskDraft => ({ title: '', effort: 'medium', cadenceType: 'weekly', count: 3 });

	// XP a task plans in a normal week (monthly counts spread over 4 weeks).
	export const weeklyXp = (t: TaskDraft) =>
		XP[t.effort] * (t.cadenceType === 'daily' ? 7 : t.cadenceType === 'weekly' ? t.count : t.count / 4);
</script>

<script lang="ts">
	import Segmented from './Segmented.svelte';

	let { task = $bindable(), index, onremove }: { task: TaskDraft; index: number; onremove?: () => void } = $props();

	const max = $derived(task.cadenceType === 'weekly' ? 7 : 31);
	const step = (delta: number) => (task.count = Math.min(max, Math.max(1, task.count + delta)));
</script>

<div class="flex flex-col gap-3 rounded-2xl bg-card p-4">
	<div class="flex items-center gap-2">
		<label class="sr-only" for="task-{index}">Task {index + 1}</label>
		<input
			id="task-{index}"
			bind:value={task.title}
			placeholder="e.g. Practice system design"
			maxlength="120"
			class="h-11 min-w-0 flex-1 rounded-lg bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
		/>
		{#if onremove}
			<button type="button" onclick={onremove} aria-label="Remove task {index + 1}" class="flex size-11 items-center justify-center text-muted-foreground">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
			</button>
		{/if}
	</div>

	<Segmented
		label="Effort"
		bind:value={task.effort}
		options={[
			{ value: 'light', label: 'Light', detail: '+10' },
			{ value: 'medium', label: 'Medium', detail: '+20' },
			{ value: 'heavy', label: 'Heavy', detail: '+30' },
		]}
	/>

	<div class="flex items-center gap-2">
		<div class="flex-1">
			<Segmented
				label="How often"
				bind:value={task.cadenceType}
				options={[
					{ value: 'daily', label: 'Daily' },
					{ value: 'weekly', label: 'Weekly' },
					{ value: 'monthly', label: 'Monthly' },
				]}
			/>
		</div>
		{#if task.cadenceType !== 'daily'}
			<div class="flex h-12 items-center rounded-xl bg-background" role="group" aria-label="Times per {task.cadenceType === 'weekly' ? 'week' : 'month'}">
				<button type="button" class="size-10 text-lg text-soft" aria-label="Fewer" onclick={() => step(-1)}>−</button>
				<span class="w-8 text-center font-mono text-sm">{task.count}×</span>
				<button type="button" class="size-10 text-lg text-soft" aria-label="More" onclick={() => step(1)}>+</button>
			</div>
		{/if}
	</div>
</div>
