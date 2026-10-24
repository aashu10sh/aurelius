import { createRouter } from 'sv-router';
import AppGoalsId from '../src/routes/_app/goals/[id].svelte';
import AppGoalsIndex from '../src/routes/_app/goals/index.svelte';
import AppGoalsNew from '../src/routes/_app/goals/new.svelte';
import AppLayout from '../src/routes/_app/layout.svelte';
import appHooks from '../src/routes/_app/hooks';
import AppJournalIndex from '../src/routes/_app/journal/index.svelte';
import AppJournalWeek from '../src/routes/_app/journal/week.svelte';
import AppProgress from '../src/routes/_app/progress.svelte';
import AppSettings from '../src/routes/_app/settings.svelte';
import AppToday from '../src/routes/_app/today.svelte';
import hooks from '../src/routes/hooks';
import Index from '../src/routes/index.svelte';
import onboardingHooks from '../src/routes/onboarding/hooks';
import OnboardingIndex from '../src/routes/onboarding/index.svelte';
import SignIn from '../src/routes/sign-in.svelte';
import SignUp from '../src/routes/sign-up.svelte';
import Welcome from '../src/routes/welcome.svelte';

export const routes = {
  '/goals': {
    '/:id': AppGoalsId,
    '/': AppGoalsIndex,
    '/new': AppGoalsNew,
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/journal': {
    '/': AppJournalIndex,
    '/week': AppJournalWeek,
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/progress': {
    '/': AppProgress,
    'layout': AppLayout,
    'hooks': appHooks
  },
  '/settings': {
    '/': AppSettings,
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
    '/': OnboardingIndex
  },
  '/sign-in': SignIn,
  '/sign-up': SignUp,
  '/welcome': Welcome
};
export type Routes = typeof routes;
export const { p, navigate, isActive, preload, resolveMeta, route } = createRouter(routes);
