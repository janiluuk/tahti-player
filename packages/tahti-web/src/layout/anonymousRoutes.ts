/**
 * Pages a visitor can use without an account. Anywhere else the shell opens
 * the sign-in dialog on arrival. A page that only needs an account for one
 * action (subscribe, book a slot) belongs here and asks at that action.
 */
const ANONYMOUS_ALLOWED_ROUTES = [
  /^\/$/,
  /^\/listen(?:\/|$)/,
  /^\/settings(?:\/|$)/,
  /^\/(login|join|apply|signup|verify|setup-password|forgot-password|reset-password)(?:\/|$)/,
  /^\/(about|privacy|terms|agpl|help|what-is-it|how-it-works|for-artists)(?:\/|$)/,
  /^\/(status|whats-new|news)(?:\/|$)/,
  /^\/newsletter(?:\/|$)/,
  /^\/(radio|discover|search|schedule)(?:\/|$)/,
  /^\/(channel|c|u|r|t|v|venues|subscribe)(?:\/|$)/,
  /^\/(listen\/favorites|library\/favorites|favorites)(?:\/|$)/,
  /^\/library\/local(?:\/|$)/,
  /^\/studio(?:\/|$)/,
  /^\/transparency(?:\/|$)/,
  /^\/governance\/history(?:\/|$)/,
  /^\/governance(?:\/feature-requests)?$/,
];

export function isAnonymousRouteAllowed(pathname: string): boolean {
  return ANONYMOUS_ALLOWED_ROUTES.some((route) => route.test(pathname));
}
