import type { Meta, StoryObj } from '@storybook/react-vite';
import { BannerHorizontalMedium } from './BannerHorizontalMedium';

const meta = {
  title: 'Components/BannerHorizontalMedium',
  component: BannerHorizontalMedium,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof BannerHorizontalMedium>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutSubtitle: Story = {
  args: { showSubtitle: false },
};

export const WithoutIndicator: Story = {
  args: { showIndicator: false },
};

export const ActiveIndex2: Story = {
  args: { activeIndex: 2, totalCount: 6 },
};
