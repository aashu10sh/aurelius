<script lang="ts">
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { Router } from 'sv-router';
	import { route } from 'sv-router/generated';
	import { analytics } from '$lib/analytics';
	import { queryClient } from '$lib/api/queries';
	import { Toaster } from '$lib/components/ui/sonner';

	$effect(() => analytics.screen(route.pathname));
</script>

<QueryClientProvider client={queryClient}>
	<Router />
	<Toaster />
</QueryClientProvider>
