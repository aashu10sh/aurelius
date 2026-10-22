<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	type Passthrough = Pick<
		HTMLInputAttributes,
		'type' | 'placeholder' | 'autocomplete' | 'autocapitalize' | 'inputmode' | 'minlength' | 'maxlength' | 'required'
	>;

	// Labelled text input in the Candlelight style.
	let {
		label,
		id,
		value = $bindable(''),
		hint,
		type = 'text',
		...rest
	}: Passthrough & { label: string; id: string; value?: string; hint?: string } = $props();
</script>

<div class="flex flex-col gap-2">
	<Label for={id} class="text-[15px] font-medium">{label}</Label>
	<Input
		{id}
		type={type as 'text'}
		bind:value
		class="h-12 rounded-xl border-border bg-card px-4 text-base"
		placeholder={rest.placeholder}
		autocomplete={rest.autocomplete}
		autocapitalize={rest.autocapitalize}
		inputmode={rest.inputmode}
		minlength={rest.minlength}
		maxlength={rest.maxlength}
		required={rest.required}
	/>
	{#if hint}<p class="m-0 text-[13px] text-muted-foreground">{hint}</p>{/if}
</div>
