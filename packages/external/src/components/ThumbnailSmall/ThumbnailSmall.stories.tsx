import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThumbnailSmall } from './ThumbnailSmall';

const meta = {
  title: 'Components/ThumbnailSmall',
  component: ThumbnailSmall,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ThumbnailSmall>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const InRow: Story = {
  name: 'In Row Context',
  render: () => (
    <div style={{ display: 'flex', gap: 4, padding: 8, background: '#f4f5fa', borderRadius: 8 }}>
      <ThumbnailSmall />
      <ThumbnailSmall />
      <ThumbnailSmall />
      <ThumbnailSmall />
    </div>
  ),
};
