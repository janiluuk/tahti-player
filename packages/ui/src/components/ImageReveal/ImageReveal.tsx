import { AnimatePresence, motion } from 'motion/react';
import { FC, ReactNode, SyntheticEvent, useState } from 'react';

import { useSkipEnterMotion } from '../../hooks/useSkipEnterMotion';
import { cn } from '../../utils';

type ImageRevealProps = {
  src?: string;
  alt?: string;
  enabled?: boolean;
  className?: string;
  imgClassName?: string;
  placeholder?: ReactNode;
  loading?: 'eager' | 'lazy';
  decoding?: 'sync' | 'async' | 'auto';
  transitionDuration?: number;
  ease?: [number, number, number, number];
  onLoad?: () => void;
  onError?: () => void;
};

const loadedImages = new Map<string, HTMLImageElement>();
const MAX_CACHED_IMAGES = 64;

export const ImageReveal: FC<ImageRevealProps> = (props) => (
  <ImageRevealContent key={props.src} {...props} />
);

const ImageRevealContent: FC<ImageRevealProps> = ({
  src,
  alt,
  enabled = true,
  className,
  imgClassName,
  placeholder,
  loading = 'lazy',
  decoding = 'async',
  transitionDuration = 0.2,
  ease = [0.22, 1, 0.36, 1],
  onLoad,
  onError,
}) => {
  const prefersReduced = useSkipEnterMotion();
  const [cached] = useState(() => Boolean(src && loadedImages.has(src)));
  const animationsDisabled = !enabled || !!prefersReduced || cached;

  const [loaded, setLoaded] = useState(cached);
  const [errored, setErrored] = useState(false);

  const showImage = Boolean(src) && !errored;

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    if (src) {
      loadedImages.delete(src);
      loadedImages.set(
        src,
        event.currentTarget.cloneNode(false) as HTMLImageElement,
      );
      if (loadedImages.size > MAX_CACHED_IMAGES) {
        const oldest = loadedImages.keys().next().value;
        if (oldest !== undefined) {
          loadedImages.delete(oldest);
        }
      }
    }
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    if (src) {
      loadedImages.delete(src);
    }
    setErrored(true);
    onError?.();
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {showImage &&
        (animationsDisabled ? (
          <img
            src={src}
            alt={alt ?? ''}
            className={cn('h-full w-full object-cover', imgClassName)}
            onLoad={handleLoad}
            onError={handleError}
            loading={loading}
            decoding={decoding}
          />
        ) : (
          <motion.img
            key={src}
            src={src}
            alt={alt ?? ''}
            className={cn('h-full w-full object-cover', imgClassName)}
            initial={{ opacity: 0 }}
            animate={{
              opacity: loaded ? 1 : 0,
            }}
            transition={{ duration: transitionDuration, ease }}
            onLoad={handleLoad}
            onError={handleError}
            loading={loading}
            decoding={decoding}
          />
        ))}

      {!showImage && placeholder && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {placeholder}
        </div>
      )}

      {src &&
        !loaded &&
        !errored &&
        placeholder &&
        (animationsDisabled ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {placeholder}
          </div>
        ) : (
          <AnimatePresence initial>
            <motion.div
              key="image-reveal-placeholder"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {placeholder}
            </motion.div>
          </AnimatePresence>
        ))}
    </div>
  );
};
