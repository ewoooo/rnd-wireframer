import type { Meta, StoryObj } from '@storybook/react-vite';
import { BannerShop } from './BannerShop';

const meta = {
  title: 'Components/BannerShop',
  component: BannerShop,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof BannerShop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomText: Story = {
  args: {
    subtitle: 'Galaxy S25',
    titleLine1: '새로운 경험, 새로운 시작.',
    titleLine2: 'T 다이렉트샵 혜택',
  },
};
