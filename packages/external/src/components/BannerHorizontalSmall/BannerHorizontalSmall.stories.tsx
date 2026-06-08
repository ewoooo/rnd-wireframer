import type { Meta, StoryObj } from '@storybook/react-vite';
import { BannerHorizontalSmall } from './BannerHorizontalSmall';

const meta = {
  title: 'Components/BannerHorizontalSmall',
  component: BannerHorizontalSmall,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof BannerHorizontalSmall>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutIndicator: Story = {
  args: { showIndicator: false },
};

export const ActiveIndex1: Story = {
  args: { activeIndex: 1, totalCount: 3 },
};
