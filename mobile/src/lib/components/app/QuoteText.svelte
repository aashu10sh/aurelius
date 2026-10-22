<script lang="ts">
	import type { Quote } from '$lib/quotes';
	import { cn } from '$lib/utils';

	let { quote, large = false, caption = false }: { quote: Quote; large?: boolean; caption?: boolean } = $props();
</script>

<figure class="m-0 flex flex-col gap-3">
	<blockquote
		class={cn(
			'm-0 font-serif italic',
			large ? 'text-2xl leading-[1.4] text-foreground' : 'text-[17px] leading-[1.45] text-soft',
		)}
	>
		“{quote.text}”
	</blockquote>
	{#if caption}
		<figcaption class="eyebrow">{quote.author}{quote.source ? ` · ${quote.source}` : ''}</figcaption>
	{/if}
</figure>
