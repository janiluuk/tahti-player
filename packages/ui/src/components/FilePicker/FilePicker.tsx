import { FileIcon, UploadCloudIcon } from 'lucide-react';
import {
  useId,
  useState,
  type ChangeEventHandler,
  type ComponentPropsWithoutRef,
  type FC,
  type ReactNode,
} from 'react';

import { cn } from '../../utils';

export type FilePickerLabels = {
  title: string;
  description?: string;
  browse: string;
  selected?: string;
};

export type FilePickerProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'children' | 'className' | 'onChange' | 'type'
> & {
  className?: string;
  icon?: ReactNode;
  labels: FilePickerLabels;
  onFiles?: (files: readonly File[]) => void;
  selectedFiles?: readonly File[];
};

export const FilePicker: FC<FilePickerProps> = ({
  accept,
  className,
  disabled,
  icon,
  id,
  labels,
  multiple,
  onFiles,
  selectedFiles = [],
  ...props
}) => {
  const [dragActive, setDragActive] = useState(false);
  const generatedId = useId();
  const inputId = id ?? `file-picker-${generatedId}`;
  const onChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onFiles?.(Array.from(event.target.files ?? []));
    event.currentTarget.value = '';
  };

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <label
        htmlFor={inputId}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) {
            setDragActive(true);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (!disabled) {
            onFiles?.(Array.from(event.dataTransfer.files));
          }
        }}
        className={cn(
          'border-border bg-background-secondary/40 hover:bg-background-secondary flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-5 py-6 text-center transition-colors',
          dragActive && 'border-primary bg-primary/10',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span className="border-border bg-background text-primary-strong flex size-10 items-center justify-center rounded-lg border">
          {icon ?? <UploadCloudIcon size={20} aria-hidden />}
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-foreground text-sm font-semibold">
            {labels.title}
          </span>
          {labels.description ? (
            <span className="text-foreground-secondary text-xs">
              {labels.description}
            </span>
          ) : null}
        </span>
        <span className="border-border bg-background text-foreground rounded-md border px-3 py-1.5 text-xs font-medium">
          {labels.browse}
        </span>
        <input
          {...props}
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          multiple={multiple}
          className="sr-only"
          aria-label={labels.title}
          onChange={onChange}
        />
      </label>
      {selectedFiles.length > 0 ? (
        <ul className="text-foreground-secondary flex flex-col gap-1 text-xs">
          {selectedFiles.map((file) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="border-border bg-background flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <FileIcon size={14} aria-hidden className="text-primary-strong" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0">{labels.selected ?? 'Selected'}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
