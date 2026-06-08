import type { Meta, StoryObj } from '@storybook/react-vite';
import { BannerSearch } from './BannerSearch';

const meta = {
  title: 'Components/BannerSearch',
  component: BannerSearch,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof BannerSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
