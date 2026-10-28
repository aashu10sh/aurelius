import { createRouter } from 'sv-router';
import AppGoalsIndex from '../src/routes/_app/goals/index.svelte';
import AppLayout from '../src/routes/_app/layout.svelte';
import appHooks from '../src/routes/_app/hooks';
import AppJournalIndex from '../src/routes/_app/journal/index.svelte';
import AppProgress from '../src/routes/_app/progress.svelte';
import AppToday from '../src/routes/_app/today.svelte';
import hooks from '../src/routes/hooks';
import Index from '../src/routes/index.svelte';
import onboardingHooks from '../src/routes/onboarding/hooks';

export const routes = {
  '/goals': {
    '/:id': () => import('../src/routes/_app/goals/[id].lazy.svelte'),
    '/': AppGoalsIndex,
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
  '/progress': {
    '/': AppProgress,
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/settings': {
    '/': () => import('../src/routes/_app/settings/index.lazy.svelte'),
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/today': {
    '/': AppToday,
    'layout': AppLayout,
    'hooks': appHooks
  },
  'hooks': hooks,
  '/': Index,
  '/onboarding': {
    'hooks': onboardingHooks,
    '/': () => import('../src/routes/onboarding/index.lazy.svelte')
  },
  '/sign-in': {
    '/': () => import('../src/routes/sign-in/index.lazy.svelte')
  },
  '/sign-up': {
    '/': () => import('../src/routes/sign-up/index.lazy.svelte')
  },
  '/welcome': {
    '/': () => import('../src/routes/welcome/index.lazy.svelte')
  }
};
export type Routes = typeof routes;
export const { p, navigate, isActive, preload, resolveMeta, route } = createRouter(routes);
