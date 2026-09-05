import { Check, Copy } from 'lucide-react';
import { ComponentProps, FC, memo, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '../Button';
import { Tooltip } from '../Tooltip';

const COPY_FEEDBACK_DURATION_MS = 10_000;

export type CopyButtonProps = Omit<
  ComponentProps<typeof Button>,
  'onClick' | 'children'
> & {
  text: string;
  /** Confirmed ("copied") state duration in ms. Defaults to 10s. */
  feedbackDurationMs?: number;
  /** Show a toast on copy. `true` uses a generic message; a string is shown as-is. */
  toastMessage?: string | boolean;
};

const CopyButtonImpl: FC<CopyButtonProps> = ({
  text,
  size = 'icon-sm',
  feedbackDurationMs = COPY_FEEDBACK_DURATION_MS,
  toastMessage,
  'aria-label': ariaLabel,
  title,
  ...props
}) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const label = ariaLabel ?? title ?? 'Copy';

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (toastMessage) {
      toast.success(
        typeof toastMessage === 'string' ? toastMessage : 'Copied to clipboard',
      );
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setCopied(false);
    }, feedbackDurationMs);
  };

  return (
    <Tooltip content={label} side="top">
      <Button size={size} onClick={handleCopy} aria-label={label} {...props}>
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    </Tooltip>
  );
};

export const CopyButton = memo(CopyButtonImpl);
