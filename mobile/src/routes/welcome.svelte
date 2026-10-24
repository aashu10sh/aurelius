<script lang="ts">
	import { p } from 'sv-router/generated';
	import InstallCard from '$lib/components/app/InstallCard.svelte';
	import Logo from '$lib/components/app/Logo.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-5 pt-14 pb-[max(env(safe-area-inset-bottom),50px)]">
	<div class="flex flex-1 flex-col items-center justify-center gap-4">
		<Logo animated />
		<div class="animate-rise-in font-mono text-[13px] tracking-[4px] text-muted-foreground [animation-delay:500ms]">AURELIUS</div>
	</div>

	<div class="animate-rise-in [animation-delay:700ms] empty:hidden"><InstallCard /></div>

	<div class="flex animate-rise-in flex-col gap-2 [animation-delay:800ms]">
		<Button href={p('/sign-up')} size="block">Begin</Button>
		<Button href={p('/sign-in')} size="block" variant="ghost" class="font-medium">I already have an account</Button>
	</div>
</div>
