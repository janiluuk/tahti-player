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
  /** Visible label text, e.g. "Share". Omit for the default icon-only button. */
  label?: string;
  /** Confirmed ("copied") state duration in ms. Defaults to 10s. */
  feedbackDurationMs?: number;
  /** Show a toast on copy. `true` uses a generic message; a string is shown as-is. */
  toastMessage?: string | boolean;
  /** Shown via toast if the clipboard write fails. Defaults to a generic message. */
  errorMessage?: string;
};

const CopyButtonImpl: FC<CopyButtonProps> = ({
  text,
  label,
  size,
  feedbackDurationMs = COPY_FEEDBACK_DURATION_MS,
  toastMessage,
  errorMessage = 'Could not copy to clipboard',
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

  const accessibleLabel = ariaLabel ?? title ?? label ?? 'Copy';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.error(errorMessage);
      return;
    }
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
    <Tooltip content={accessibleLabel} side="top">
      <Button
        size={size ?? (label ? 'sm' : 'icon-sm')}
        onClick={() => void handleCopy()}
        aria-label={accessibleLabel}
        {...props}
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {label && <span className="ml-1.5">{copied ? 'Copied' : label}</span>}
      </Button>
    </Tooltip>
  );
};

export const CopyButton = memo(CopyButtonImpl);
