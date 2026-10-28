import { createRouter } from 'sv-router';
import Index from '../src/routes/index.svelte';
import AppToday from '../src/routes/_app/today.svelte';
import AppLayout from '../src/routes/_app/layout.svelte';
import appHooks from '../src/routes/_app/hooks';
import AppProgress from '../src/routes/_app/progress.svelte';
import AppGoalsIndex from '../src/routes/_app/goals/index.svelte';
import AppJournalIndex from '../src/routes/_app/journal/index.svelte';
import onboardingHooks from '../src/routes/onboarding/hooks';
import hooks from '../src/routes/hooks';

export const routes = {
  '/': Index,
  '/today': {
    '/': AppToday,
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/progress': {
    '/': AppProgress,
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/goals': {
    '/': AppGoalsIndex,
    '/:id': () => import('../src/routes/_app/goals/[id].lazy.svelte'),
    '/new': {
      '/': () => import('../src/routes/_app/goals/new/index.lazy.svelte')
    },
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/journal': {
    '/': AppJournalIndex,
    '/week': {
      '/': () => import('../src/routes/_app/journal/week/index.lazy.svelte')
    },
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/settings': {
    '/': () => import('../src/routes/_app/settings/index.lazy.svelte'),
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/onboarding': {
    'hooks': onboardingHooks,
    '/': () => import('../src/routes/onboarding/index.lazy.svelte')
  },
  'hooks': hooks,
  '/welcome': {
    '/': () => import('../src/routes/welcome/index.lazy.svelte')
  },
  '/sign-in': {
    '/': () => import('../src/routes/sign-in/index.lazy.svelte')
  },
  '/sign-up': {
    '/': () => import('../src/routes/sign-up/index.lazy.svelte')
  }
};
export type Routes = typeof routes;
export const { p, navigate, isActive, preload, resolveMeta, route } = createRouter(routes);
