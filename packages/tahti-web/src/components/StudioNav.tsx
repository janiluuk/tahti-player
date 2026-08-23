import { Link } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CircleDollarSignIcon,
  CloudUploadIcon,
  DiscIcon,
  DoorOpenIcon,
  FolderLockIcon,
  GalleryVerticalEndIcon,
  LayoutGridIcon,
  LibraryIcon,
  LockKeyholeIcon,
  MegaphoneIcon,
  PaletteIcon,
  RadioTowerIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SignalIcon,
  SparklesIcon,
  TicketIcon,
  TrendingUpIcon,
  type LucideIcon,
} from 'lucide-react';
import { Fragment, useState } from 'react';

import { cn } from '@nuclearplayer/ui';

import { InPageNav } from './InPageNav';

const PRIMARY = [
  { to: '/studio', label: 'Overview' },
  { to: '/studio/go-live', label: 'Go Live' },
  { to: '/library', label: 'My Library' },
  { to: '/studio/shows', label: 'Shows' },
] as const;

type StudioTool = {
  to: string;
  label: string;
  icon: LucideIcon;
  section?: string;
};

type StudioToolGroup = {
  label: string;
  icon: LucideIcon;
  tools: readonly StudioTool[];
};

const TOOL_GROUPS: readonly StudioToolGroup[] = [
  {
    label: 'Music',
    icon: SparklesIcon,
    tools: [
      { to: '/studio/upload', label: 'Upload', icon: CloudUploadIcon },
      { to: '/studio/collections', label: 'Collections', icon: LibraryIcon },
      { to: '/studio/recordings', label: 'Recordings', icon: DiscIcon },
      { to: '/studio/editor', label: 'Audio editor', icon: AudioLinesIcon },
      { to: '/studio/embeds', label: 'Embeds', icon: GalleryVerticalEndIcon },
    ],
  },
  {
    label: 'Plan',
    icon: CalendarDaysIcon,
    tools: [
      { to: '/studio/schedule', label: 'Schedule', icon: CalendarDaysIcon },
      { to: '/studio/events', label: 'Events', icon: TicketIcon },
      { to: '/studio/venues', label: 'Venues', icon: RadioTowerIcon },
    ],
  },
  {
    label: 'Grow',
    icon: TrendingUpIcon,
    tools: [
      { to: '/studio/stats', label: 'Stats', icon: SignalIcon },
      {
        to: '/studio/revenue',
        label: 'Revenue',
        icon: CircleDollarSignIcon,
      },
      { to: '/studio/updates', label: 'Updates', icon: MegaphoneIcon },
      {
        to: '/settings/broadcast',
        label: 'Green room',
        icon: DoorOpenIcon,
        section: 'Member content',
      },
      {
        to: '/studio/stash',
        label: 'Stash',
        icon: FolderLockIcon,
        section: 'Member content',
      },
      {
        to: '/studio/shows',
        label: 'Exclusive shows',
        icon: LockKeyholeIcon,
        section: 'Member content',
      },
    ],
  },
  {
    label: 'Manage',
    icon: Settings2Icon,
    tools: [
      { to: '/studio/channel', label: 'Channel design', icon: PaletteIcon },
      {
        to: '/studio/branding',
        label: 'Branding & press kit',
        icon: GalleryVerticalEndIcon,
      },
      { to: '/studio/moderation', label: 'Moderation', icon: ShieldCheckIcon },
    ],
  },
];

const ALL_TOOLS = TOOL_GROUPS.flatMap((group) => group.tools);

const isActive = (current: string | undefined, to: string) =>
  current === to || (to !== '/studio' && Boolean(current?.startsWith(to)));

export const StudioNav = ({ current }: { current?: string }) => {
  const [toolsOpen, setToolsOpen] = useState(() =>
    ALL_TOOLS.some((tool) => isActive(current, tool.to)),
  );

  return (
    <div className="flex flex-col gap-2">
      <InPageNav
        aria-label="Studio"
        items={PRIMARY.map((link) => ({
          id: link.to,
          label: link.label,
          to: link.to,
          active: isActive(current, link.to),
        }))}
      />
      <div className="border-border overflow-hidden rounded-lg border">
        <button
          type="button"
          className="bg-background-secondary/40 hover:bg-background-secondary flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase transition-colors"
          aria-expanded={toolsOpen}
          onClick={() => setToolsOpen((open) => !open)}
        >
          <LayoutGridIcon size={15} aria-hidden className="text-primary" />
          <span className="flex-1">Studio tools</span>
          <ChevronDownIcon
            size={15}
            aria-hidden
            className={cn('transition-transform', toolsOpen && 'rotate-180')}
          />
        </button>
        {toolsOpen ? (
          <div
            role="region"
            aria-label="Studio tool groups"
            className="border-border grid gap-px border-t bg-(--border) sm:grid-cols-2 lg:grid-cols-4"
          >
            {TOOL_GROUPS.map((group) => {
              const GroupIcon = group.icon;
              return (
                <section
                  key={group.label}
                  className="bg-background flex min-w-0 flex-col gap-1 p-2"
                >
                  <h2 className="text-foreground-secondary flex items-center gap-2 px-2 py-1 text-[11px] font-semibold tracking-widest uppercase">
                    <GroupIcon size={14} aria-hidden />
                    {group.label}
                  </h2>
                  {group.tools.map((tool, index) => {
                    const ToolIcon = tool.icon;
                    const active = isActive(current, tool.to);
                    const showSection =
                      tool.section &&
                      group.tools[index - 1]?.section !== tool.section;
                    return (
                      <Fragment key={`${tool.to}-${tool.label}`}>
                        {showSection ? (
                          <h3 className="text-foreground-secondary mt-2 px-2 pt-2 text-[10px] font-semibold tracking-widest uppercase">
                            {tool.section}
                          </h3>
                        ) : null}
                        <Link
                          to={tool.to}
                          className={cn(
                            'flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                            active
                              ? 'bg-primary text-foreground font-semibold'
                              : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground',
                          )}
                        >
                          <ToolIcon size={15} aria-hidden />
                          <span className="truncate">{tool.label}</span>
                        </Link>
                      </Fragment>
                    );
                  })}
                </section>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};
