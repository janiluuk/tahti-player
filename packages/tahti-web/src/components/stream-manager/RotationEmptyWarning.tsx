import { TriangleAlertIcon } from 'lucide-react';

import { Alert, ButtonLink } from '@tahti-player/ui';

import { useAuthStore } from '../../stores/authStore';

export function RotationEmptyWarning({ slug }: { slug: string }) {
  const ownsChannel = useAuthStore((s) => s.user?.channel?.slug === slug);

  return (
    <Alert
      tone="warning"
      icon={<TriangleAlertIcon size={16} aria-hidden />}
      title="The 24/7 rotation is empty"
    >
      <div className="flex flex-col items-start gap-2">
        <p>
          Nothing will play on this channel while it&apos;s not live. Add tracks
          to the rotation so listeners always hear something.
        </p>
        {/* The studio link only reaches the viewer's own channel, so board
            members looking at someone else's channel get the warning alone. */}
        {ownsChannel ? (
          <ButtonLink
            to="/studio/channel"
            search={{ tab: 'rotation' }}
            size="sm"
            variant="secondary"
          >
            Manage 24/7 rotation
          </ButtonLink>
        ) : null}
      </div>
    </Alert>
  );
}
