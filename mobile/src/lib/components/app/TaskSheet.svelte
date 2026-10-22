<script lang="ts">
	import type { GoalDetailResponse } from 'backend/contract';
	import { api } from '$lib/api/endpoints';
	import { useAction } from '$lib/api/queries';
	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer';
	import TaskEditor, { blankTask, type TaskDraft } from './TaskEditor.svelte';

	type Task = GoalDetailResponse['tasks'][number];

	// Bottom sheet to add a task to a goal, or edit / archive an existing one.
	let { open = $bindable(false), goalId, task }: { open?: boolean; goalId: string; task?: Task | null } = $props();

	let draft = $state<TaskDraft>(blankTask());
	$effect(() => {
		if (open) {
			draft = task
				? { title: task.title, effort: task.effort, cadenceType: task.cadence.type, count: task.cadence.count }
				: blankTask();
		}
	});

	const toRequest = () => ({
		title: draft.title.trim(),
		effort: draft.effort,
		cadence: { type: draft.cadenceType, count: Math.min(draft.count, draft.cadenceType === 'weekly' ? 7 : 31) },
	});

	const save = useAction(() => (task ? api.tasks.update(task.id, toRequest()) : api.goals.addTask(goalId, toRequest())));
	const archive = useAction(() => api.tasks.update(task!.id, { archived: true }));

	// Errors are toasted by useAction; the sheet stays open so nothing is lost.
	async function run(action: typeof save) {
		try {
			await action.mutateAsync(undefined);
			open = false;
		} catch {}
	}
</script>

<Drawer.Root bind:open>
	<Drawer.Content class="mx-auto max-w-md border-none bg-background">
		<Drawer.Header class="text-left">
			<Drawer.Title class="text-[17px] font-semibold">{task ? 'Edit task' : 'New small task'}</Drawer.Title>
		</Drawer.Header>
		<div class="px-4">
			<TaskEditor bind:task={draft} index={0} />
		</div>
		<Drawer.Footer class="pb-[max(env(safe-area-inset-bottom),16px)]">
			<Button size="block" disabled={!draft.title.trim() || save.isPending} onclick={() => run(save)}>
				{task ? 'Save' : 'Add task'}
			</Button>
			{#if task}
				<Button size="block" variant="ghost" class="font-medium text-muted-foreground" disabled={archive.isPending} onclick={() => run(archive)}>
					Archive task
				</Button>
			{/if}
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
