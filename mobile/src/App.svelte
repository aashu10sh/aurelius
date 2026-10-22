<script lang="ts">
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { Router } from 'sv-router';
	import 'sv-router/generated';
	import { queryClient } from '$lib/api/queries';
	import { Toaster } from '$lib/components/ui/sonner';
</script>

<QueryClientProvider client={queryClient}>
	<Router />
	<Toaster />
</QueryClientProvider>
