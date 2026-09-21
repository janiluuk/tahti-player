import {
  Outlet,
  RouterContextProvider,
  useRouter,
  useRouterState,
} from '@tanstack/react-router';
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
} from 'motion/react';
import { forwardRef, memo, useRef } from 'react';

const SLIDE_DISTANCE = 8;
const SCALE_FACTOR = 0.995;
const TRANSITION_DURATION = 0.16;
const FAST_TRANSITION_DURATION = 0.1;

const slideVariants = {
  enter: {
    x: SLIDE_DISTANCE,
    scale: SCALE_FACTOR,
    opacity: 0,
  },
  center: {
    x: 0,
    scale: 1,
    opacity: 1,
  },
  exit: {
    x: -SLIDE_DISTANCE,
    scale: SCALE_FACTOR,
    opacity: 0,
  },
};

// Opacity-only, no exit choreography: used for high-frequency in-section
// navigation (Studio/Admin/Library sub-routes) where a slide + wait-for-exit
// transition would add perceptible delay to every click.
const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

type Router = ReturnType<typeof useRouter>;

/** A read-only store that never changes: the shape react-store's
 * `useSelector` needs (`get` + `subscribe`). */
function frozenStore<T>(value: T) {
  return {
    get: () => value,
    subscribe: () => ({ unsubscribe: () => undefined }),
  };
}

/** Copies the router's current state out of its stores. The router clears a
 * route's match store the moment the route leaves, so the exiting page needs
 * its own copy to keep rendering while it animates out. */
function snapshotRouterStores(router: Router) {
  const { stores } = router;
  const matchesByRoute = new Map(
    [...stores.byRoute].map(([id, store]) => [id, store.get()]),
  );
  return {
    state: stores.__store.get(),
    status: stores.status.get(),
    location: stores.location.get(),
    resolvedLocation: stores.resolvedLocation.get(),
    ids: stores.ids.get(),
    matches: stores.matches.get(),
    matchesByRoute,
  };
}

type RouterSnapshot = ReturnType<typeof snapshotRouterStores>;

/** A router whose stores all return `snapshot` forever. */
function frozenRouter(router: Router, snapshot: RouterSnapshot): Router {
  const stores = {
    ...router.stores,
    __store: frozenStore(snapshot.state),
    status: frozenStore(snapshot.status),
    location: frozenStore(snapshot.location),
    resolvedLocation: frozenStore(snapshot.resolvedLocation),
    ids: frozenStore(snapshot.ids),
    matches: frozenStore(snapshot.matches),
    byRoute: new Map(
      [...snapshot.matchesByRoute].map(([id, match]) => [
        id,
        frozenStore(match),
      ]),
    ),
    getMatchStore: (routeId: string) =>
      frozenStore(snapshot.matchesByRoute.get(routeId)),
  };
  const proxy = Object.create(router) as Router;
  Object.defineProperty(proxy, 'stores', { value: stores });
  return proxy;
}

const AnimatedOutlet = forwardRef<HTMLDivElement, { fast?: boolean }>(
  ({ fast = false }, ref) => {
    const router = useRouter();
    const isPresent = useIsPresent();
    const reducedMotion = useReducedMotion();
    const frozenSnapshot = useRef<RouterSnapshot | null>(null);
    const frozen = useRef<Router | null>(null);

    if (isPresent) {
      // Cheap enough to redo per render, and it keeps the copy current up to
      // the moment the route starts leaving.
      frozenSnapshot.current = snapshotRouterStores(router);
      frozen.current = null;
    } else if (!frozen.current && frozenSnapshot.current) {
      frozen.current = frozenRouter(router, frozenSnapshot.current);
    }
    const outletRouter = frozen.current ?? router;

    return (
      <motion.div
        ref={ref}
        className="min-h-full w-full"
        variants={fast ? fadeVariants : slideVariants}
        initial={reducedMotion ? false : 'enter'}
        animate="center"
        exit="exit"
        transition={{
          duration: reducedMotion
            ? 0
            : fast
              ? FAST_TRANSITION_DURATION
              : TRANSITION_DURATION,
          ease: 'easeOut',
        }}
      >
        <RouterContextProvider router={outletRouter}>
          <Outlet />
        </RouterContextProvider>
      </motion.div>
    );
  },
);

// Memoized so a parent re-render for unrelated state (e.g. AppShell during a
// sidebar resize drag) doesn't re-run the router subscription and outlet
// tree below when `fast` hasn't actually changed.
export const RouteTransition = memo(function RouteTransition({
  fast = false,
}: {
  /** High-frequency in-section navigation (Studio/Admin/Library/Listen
   * tabs): skips the AnimatePresence remount-on-key cycle entirely instead
   * of just cheapening it, since every one of these pages re-declares the
   * same shared chrome (AdminGate/AdminPageLayout, StudioGate/StudioNav,
   * Listen's own tab bar) at the same position in the tree -- keying by
   * pathname forced that identical chrome to unmount and remount on every
   * click instead of letting React reconcile it in place, which is what
   * actually caused the visible flicker (not the animation style). */
  fast?: boolean;
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (fast) {
    return (
      <div className="min-h-full w-full">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-full w-full">
      <AnimatePresence mode="popLayout" initial={false}>
        <AnimatedOutlet key={pathname} fast={fast} />
      </AnimatePresence>
    </div>
  );
});
