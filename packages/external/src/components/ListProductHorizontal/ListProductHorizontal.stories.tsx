import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListProductHorizontal } from './ListProductHorizontal';

const meta = {
  title: 'Components/ListProductHorizontal',
  component: ListProductHorizontal,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    showThumb: { control: 'boolean' },
    showBadges: { control: 'boolean' },
    showIconBadges: { control: 'boolean' },
  },
} satisfies Meta<typeof ListProductHorizontal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { showThumb: true, showBadges: true, showIconBadges: true },
};

export const NoThumb: Story = {
  args: { showThumb: false, showBadges: true, showIconBadges: true },
};

export const BadgesOnly: Story = {
  args: { showThumb: true, showBadges: true, showIconBadges: false },
};

export const IconBadgesOnly: Story = {
  args: { showThumb: true, showBadges: false, showIconBadges: true },
};

export const MinimalInfo: Story = {
  args: { showThumb: false, showBadges: false, showIconBadges: false },
};
