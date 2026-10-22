<script lang="ts">
	import { p } from 'sv-router/generated';
	import Logo from '$lib/components/app/Logo.svelte';
	import QuoteText from '$lib/components/app/QuoteText.svelte';
	import { Button } from '$lib/components/ui/button';
	import { quoteOfDay, todayKey } from '$lib/quotes';

	const quote = quoteOfDay(todayKey());
</script>

<div class="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-5 pt-14 pb-[max(env(safe-area-inset-bottom),50px)]">
	<div class="flex flex-1 flex-col items-center justify-center gap-4">
		<Logo />
		<div class="font-mono text-[13px] tracking-[4px] text-muted-foreground">AURELIUS</div>
	</div>

	<QuoteText {quote} large caption />

	<div class="flex flex-col gap-2">
		<Button href={p('/sign-up')} size="block">Begin</Button>
		<Button href={p('/sign-in')} size="block" variant="ghost" class="font-medium">I already have an account</Button>
	</div>
</div>
