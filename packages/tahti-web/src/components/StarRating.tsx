import { StarIcon } from 'lucide-react';

export function StarRating({
  stars,
  max = 5,
}: {
  stars: number;
  max?: number;
}) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${stars} of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => (
        <StarIcon
          key={i}
          size={16}
          aria-hidden
          className={i < stars ? 'fill-primary text-primary' : 'text-border'}
        />
      ))}
    </div>
  );
}
