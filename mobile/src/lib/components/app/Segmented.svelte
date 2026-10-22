<script lang="ts" generics="T extends string">
	import * as ToggleGroup from '$lib/components/ui/toggle-group';

	// Single-choice segmented control that always keeps a value selected.
	let {
		label,
		options,
		value = $bindable(),
	}: { label: string; options: { value: T; label: string; detail?: string }[]; value: T } = $props();
</script>

<ToggleGroup.Root
	type="single"
	aria-label={label}
	bind:value={() => value, (next) => next && (value = next as T)}
	class="grid w-full gap-1 rounded-xl bg-card p-1"
	style="grid-template-columns: repeat({options.length}, minmax(0, 1fr))"
>
	{#each options as option (option.value)}
		<ToggleGroup.Item
			value={option.value}
			class="h-10 min-w-0 flex-col gap-0 rounded-lg text-[13px] text-soft hover:bg-accent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
		>
			<span>{option.label}</span>
			{#if option.detail}<span class="font-mono text-[10.5px] opacity-80">{option.detail}</span>{/if}
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>
