<script lang="ts">
	import { untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { duration } from '$lib/feel/motion';

	// Counts to a new value instead of jumping; the first render shows it as is.
	let { value }: { value: number } = $props();

	const shown = new Tween(untrack(() => value), { easing: cubicOut });
	$effect(() => {
		shown.set(value, { duration: duration(Math.min(700, 250 + Math.abs(value - shown.target) * 6)) });
	});
</script>

{Math.round(shown.current)}
