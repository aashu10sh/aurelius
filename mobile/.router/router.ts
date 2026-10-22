import { createRouter } from 'sv-router';
import hooks from '../src/routes/hooks';
import Index from '../src/routes/index.svelte';
import AppToday from '../src/routes/_app/today.svelte';
import AppLayout from '../src/routes/_app/layout.svelte';
import appHooks from '../src/routes/_app/hooks';
import AppProgress from '../src/routes/_app/progress.svelte';
import AppGoalsIndex from '../src/routes/_app/goals/index.svelte';
import AppGoalsNew from '../src/routes/_app/goals/new.svelte';
import AppGoalsId from '../src/routes/_app/goals/[id].svelte';
import AppJournal from '../src/routes/_app/journal.svelte';
import AppSettings from '../src/routes/_app/settings.svelte';
import Welcome from '../src/routes/welcome.svelte';
import SignIn from '../src/routes/sign-in.svelte';
import SignUp from '../src/routes/sign-up.svelte';
import onboardingHooks from '../src/routes/onboarding/hooks';
import OnboardingIndex from '../src/routes/onboarding/index.svelte';

export const routes = {
  'hooks': hooks,
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
    '/new': AppGoalsNew,
    '/:id': AppGoalsId,
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/journal': {
    '/': AppJournal,
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/settings': {
    '/': AppSettings,
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/welcome': Welcome,
  '/sign-in': SignIn,
  '/sign-up': SignUp,
  '/onboarding': {
    'hooks': onboardingHooks,
    '/': OnboardingIndex
  }
};
export type Routes = typeof routes;
export const { p, navigate, isActive, preload, resolveMeta, route } = createRouter(routes);
