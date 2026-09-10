import type { Meta, StoryObj } from '@storybook/react-vite';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';

import { Button, ViewShell } from '@tahti-player/ui';

const meta: Meta<typeof ViewShell> = {
  title: 'Components/ViewShell',
  component: ViewShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The standard full-height, scrollable page frame most top-level views mount into — an optional title/subtitle, then a scrollable content area filling the rest of the viewport. Tahti-web list pages (Listen, Studio, Admin) should use this instead of PageHeader / StudioPageHeader: title = page name only, subtitle = one short line, actions in children. Persistent nav (StudioNav, Admin tabs, Listen tabs) stays outside ViewShell. Nested under AppShell padding: pass classes.root px-0 pt-0 so padding does not double. Leave: full-screen player, share canvases, maximized Pro Editor, entity cover headers. Plan: docs/todo/viewshell-page-headers.md.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<Meta<typeof ViewShell>>;

export const Default: Story = {
  render: () => (
    <div className="h-[480px]">
      <ViewShell title="Library" subtitle="Everything you've saved">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="border-border w-full border-b py-3 text-sm">
            Row {i + 1}
          </div>
        ))}
      </ViewShell>
    </div>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <div className="h-[240px]">
      <ViewShell title="Sounds">
        <p className="text-sm">
          Subtitle omitted when the page name is enough.
        </p>
      </ViewShell>
    </div>
  ),
};

export const WithActions: Story = {
  render: () => (
    <div className="h-[480px]">
      <ViewShell
        title="Sounds"
        subtitle="Your files, in one place."
        actions={
          <>
            <Button size="icon" aria-label="Add new">
              <PlusIcon />
            </Button>
            <Button size="icon" variant="secondary" aria-label="Edit">
              <PencilIcon />
            </Button>
            <Button size="icon" variant="secondary" aria-label="Delete">
              <Trash2Icon />
            </Button>
          </>
        }
      >
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="border-border w-full border-b py-3 text-sm">
            Row {i + 1}
          </div>
        ))}
      </ViewShell>
    </div>
  ),
};

export const NestedUnderAppPadding: Story = {
  render: () => (
    <div className="h-[240px] p-6">
      <ViewShell
        title="Dashboard"
        subtitle="Members, live streams, and health."
        classes={{ root: 'px-0 pt-0' }}
      >
        <p className="text-sm">
          classes.root px-0 pt-0 when AppShell already pads the pane.
        </p>
      </ViewShell>
    </div>
  ),
};
