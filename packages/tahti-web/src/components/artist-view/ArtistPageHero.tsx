import {
  EntitySocialHeader,
  type EntitySocialHeaderProps,
} from '../EntitySocialHeader';

/** The artist page hero. When the artist turns "Show page hero" off in
 * Settings, the banner card goes away but its actions (follow, subscribe,
 * owner tools) stay reachable in a slim row. */
export function ArtistPageHero({
  hidden,
  ...props
}: EntitySocialHeaderProps & { hidden: boolean }) {
  if (!hidden) {
    return <EntitySocialHeader {...props} />;
  }
  return (
    <div
      className="flex flex-wrap items-center justify-end gap-2"
      data-testid="artist-header-actions"
    >
      <h1 className="sr-only">{props.title}</h1>
      {props.actions}
    </div>
  );
}
