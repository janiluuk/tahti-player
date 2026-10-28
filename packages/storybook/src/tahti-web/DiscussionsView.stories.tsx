import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiscussionsView } from '@tahti-web/views/DiscussionsView';
import { DiscussionTopicView } from '@tahti-web/views/DiscussionTopicView';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof DiscussionsView> = {
  title: 'Tahti/Governance/Discussions',
  component: DiscussionsView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/governance/discussions'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The mock app's pinned open topic first, then the closed one. */
export const TopicList: Story = {
  render: () => (
    <div className="p-6">
      <DiscussionsView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = await canvas.findByRole('list', {
      name: 'Discussion topics',
    });
    const links = within(list).getAllByRole('link');
    await expect(links[0]).toHaveTextContent(
      'A Tahti stage at a summer festival in 2027?',
    );
    await expect(links[1]).toHaveTextContent('Membership fee for 2026');
    await expect(canvas.getByLabelText('Pinned')).toBeVisible();
    await expect(within(list).getByText('Closed')).toBeVisible();
    await expect(canvas.getByText('1 new reply')).toBeVisible();
    await expect(canvas.getByText(/last reply by Aino Virtanen/)).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Mark all read' }),
    );
    await expect(canvas.queryByText('1 new reply')).not.toBeInTheDocument();
  },
};

/** An open topic you follow, with replies; post a reply. */
export const OpenTopic: Story = {
  render: () => (
    <div className="p-6">
      <DiscussionTopicView id="topic-festival-2027" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('I would love to play a late ambient set.'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Unfollow' }),
    ).toBeVisible();
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Your reply' }),
      'Count me in',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Post reply' }));
    await expect(await canvas.findByText('Count me in')).toBeVisible();
  },
};

/** A closed topic shows its replies but no reply form. */
export const ClosedTopic: Story = {
  render: () => (
    <div className="p-6">
      <DiscussionTopicView id="topic-fees-2026" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/it takes no more replies/),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('textbox', { name: 'Your reply' }),
    ).not.toBeInTheDocument();
  },
};
