<script lang="ts">
	import type { CreateGoalRequest } from 'backend/contract';
	import { navigate, p } from 'sv-router/generated';
	import { api } from '$lib/api/endpoints';
	import { useAction } from '$lib/api/queries';
	import GoalForm from '$lib/components/app/GoalForm.svelte';
	import TopBar from '$lib/components/app/TopBar.svelte';

	let error = $state('');
	const create = useAction((goal: CreateGoalRequest) => api.goals.create(goal), { quiet: true });

	async function submit(goal: CreateGoalRequest) {
		error = '';
		try {
			const created = await create.mutateAsync(goal);
			navigate('/goals/:id', { params: { id: created.id } });
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not save your goal';
		}
	}
</script>

<div class="flex flex-col gap-4">
	<TopBar href={p('/goals')} icon="close" />
	<h1 class="m-0 text-[28px] leading-[1.15] font-semibold tracking-tight">New goal</h1>
</div>
<GoalForm submitLabel="Create goal" pending={create.isPending} {error} onsubmit={submit} />
