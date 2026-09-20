import { createRoute, redirect } from '@tanstack/react-router';

import { ForgotPasswordView } from '../views/ForgotPasswordView';
import { JoinView } from '../views/JoinView';
import { LoginView } from '../views/LoginView';
import { ResetPasswordView } from '../views/ResetPasswordView';
import { SetupPasswordView } from '../views/SetupPasswordView';
import { SignupPaymentView } from '../views/SignupPaymentView';
import { VerifyView } from '../views/VerifyView';
import { appLayoutRoute } from './router-core';
import { StatusView } from './router-lazy-views';

export const joinRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/join',
  component: JoinView,
});

/** Legacy /apply and /signup URLs — land on Join, which already explains
 * whether registration is open, rather than 404ing an inbound link. */
export const applyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/apply',
  beforeLoad: () => {
    throw redirect({ to: '/join' });
  },
});

export const signupRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/signup',
  beforeLoad: () => {
    throw redirect({ to: '/join' });
  },
});

export const signupPaymentRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/signup/payment',
  component: SignupPaymentView,
});

export const verifyRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/verify',
  component: VerifyView,
});

export const setupPasswordRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/setup-password',
  component: SetupPasswordView,
});

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/forgot-password',
  component: ForgotPasswordView,
});

export const resetPasswordRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/reset-password',
  component: ResetPasswordView,
});

export const loginRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/login',
  component: LoginView,
});

export const accountRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/account',
  beforeLoad: () => {
    throw redirect({
      to: '/settings/$section',
      params: { section: 'account' },
    });
  },
});

export const statusRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/status',
  component: StatusView,
});
