import type { Meta, StoryObj } from '@storybook/react-vite';
import { Coupon } from './Coupon';

const meta = {
  title: 'Components/Coupon',
  component: Coupon,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Coupon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomBadges: Story = {
  args: {
    badges: [
      { label: '혜택 브랜드 할인 쿠폰', variant: 'default' },
      { label: 'D-1', variant: 'timer' },
    ],
  },
};
