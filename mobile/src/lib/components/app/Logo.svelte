<script lang="ts">
	// Sans "A" with an amber asterisk.
	let { size = 88 }: { size?: number } = $props();
</script>

<div role="img" aria-label="Aurelius" class="flex items-start gap-0.5 leading-none">
	<span class="font-semibold tracking-tight text-foreground" style:font-size="{size}px">A</span>
	<span class="font-semibold text-amber" style:font-size="{size * 0.64}px" style:margin-top="-{size * 0.05}px">*</span>
</div>
