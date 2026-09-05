# CODE STYLE

Extracted from root `AGENTS.md` for on-demand reading.

## Code Style

### General Principles

- Prioritize readability over cleverness. This is production code for long-term maintenance — no placeholders, shortcuts, or half-baked methods.
- No comments in code - explain reasoning in chat/commits
- Avoid premature abstractions - start concrete, extract later
- Stick to existing conventions. Look at other packages when in doubt. Use the centralized TypeScript, ESLint, Prettier, and Tailwind configs.
- Small, focused changes over large dumps
- Trim dead code and copy-paste when you see it
- Never commit unless explicitly asked

### TypeScript

- Use `type` not `interface` (except when merging is required). Do not use interfaces for props.
- No magic numbers - extract into named constants
- Strict mode with `noUnusedLocals` and `noUnusedParameters`
- Do not use one-letter variable names.
AVOID: `(b) => b.buildIndexEntry()`
PREFER: `(build) => build.buildIndexEntry()`

### React Components

```tsx
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps, FC } from 'react';

import { cn } from '../../utils';

const componentVariants = cva('base-classes', {
  variants: { /* ... */ },
  defaultVariants: { /* ... */ },
});

type ComponentProps = ComponentProps<'div'> &
  VariantProps<typeof componentVariants>;

export const Component: FC<ComponentProps> = ({
  className,
  variant,
  ...props
}) => (
  <div className={cn(componentVariants({ variant, className }))} {...props} />
);
```

- Use `const Component: FC<Props>` not `function Component()`
- Compound components (`Component.Sub`) for complex widgets
- Keep business logic out of UI components. Presentation-only; lift complex or performance-critical work to Tauri (Rust).

### Storybook-first UI

When changing anything a user sees (layout, controls, status, empty/loading, overlays), **prefer a component that already exists in Storybook** (`pnpm storybook`, `packages/storybook/src/`). That catalogue is `@tahti-player/ui` plus tahti-web local shared pieces under `packages/storybook/src/tahti-web/`.

1. Look up the Storybook story first. Use that component. Do not hand-roll a second button, badge, tab strip, dialog, empty state, or image treatment.
2. If the Storybook component shows different **data** or **behavior** than the live screen, keep the live data and features. Swap only the visual primitive. Do not drop overlays, counts, routes, or actions to make the page look more like the demo.
3. If no Storybook component exists at all, add it there with the states that exist today (default, empty, loading, error, disabled, selected — whichever apply). Flag states the component should have but does not yet (`Missing states:` in the story docs). Then use it.
4. If a Storybook story is an **orphan** (nothing in the player or tahti-web renders that component), flag it on the story (`Orphan:` in the docs description, and why). Do not delete it in the same pass as a UI sweep unless the user asked to remove it.
5. New `@tahti-player/ui` components still follow the directory/test/export checklist below.

### Adding UI Components

When adding a new component to `@tahti-player/ui`:

1. Create component directory: `packages/ui/src/components/MyComponent/`
   - `MyComponent.tsx` - implementation
   - `MyComponent.test.tsx` - tests (aim for 100% coverage)
   - `index.ts` - re-exports
2. Export from `packages/ui/src/components/index.ts`
3. Add Storybook story in `packages/storybook/src/MyComponent.stories.tsx`
4. Include snapshot test(s) covering all variants

### Styling (Tailwind v4)

- CSS-first config in `packages/tailwind-config/global.css` (`@theme` / `@layer`). There is no `tailwind.config.js`.
- Do not use Tailwind's built-in color palette. Prefer the tokens in `global.css`.
- Theme colors: `bg-background`, `text-foreground`, `bg-primary`
- Accents: `accent-green`, `accent-yellow`, `accent-purple`, `accent-blue`, `accent-orange`, `accent-cyan`, `accent-red`
- Fonts are design-system defaults (`font-sans`, `font-heading`). You rarely need to set fonts by hand.
- Use `cn()` for conditional classes, `cva()` for variants

### State Management

- **Zustand** - persistent UI state
- **React state** - local, temporary state
- **TanStack Query v5** - HTTP requests/server state
- **TanStack Router** - client-side routing

### Standardized Libraries

- **Icons**: Lucide React (not heroicons, not font-awesome)
- **Toasts**: Sonner
- **Dates**: Luxon
- **Utilities**: lodash-es (use individual imports: `import isEqual from 'lodash-es/isEqual'`)
- **HTTP**: Native fetch via ApiClient base class (no axios)

### Adding New Domains

A "domain" is a feature area exposed to plugins (e.g., settings, queue, favorites). When adding a new domain:

1. **Types** (`packages/plugin-sdk/src/types/myDomain.ts`)
   - Define the `MyDomainHost` interface (the contract between player and SDK)
   - Export any related types plugins will use

2. **API class** (`packages/plugin-sdk/src/api/myDomain.ts`)
   - Create a class that wraps the host and exposes methods to plugins
   - Add to `TahtiAPI` constructor in `packages/plugin-sdk/src/api/index.ts`

3. **Store** (`packages/player/src/stores/myDomainStore.ts`)
   - Zustand store holding the domain state
   - Persists to disk via `@tauri-apps/plugin-store` if needed

4. **Host** (`packages/player/src/services/myDomainHost.ts`)
   - Implements the `MyDomainHost` interface
   - Bridges the SDK API to the Zustand store
   - Passed to `TahtiAPI` when initializing plugins

### External API Clients

Live in `packages/player/src/apis/`. Use `ApiClient` base class (fetch→json→Zod).

- Validate external data with Zod schemas
- Export singleton instances
- One class per external service

### Internationalization

All user-facing strings go through i18n - no hardcoded UI text.

```tsx
import { useTranslation } from '@tahti-player/i18n';

const { t } = useTranslation();
<span>{t('navigation.settings')}</span>
```

Add new strings to `packages/i18n/src/locales/en_US.json` only. Other locales come from Crowdin.

