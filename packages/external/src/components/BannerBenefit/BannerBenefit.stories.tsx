import type { Meta, StoryObj } from '@storybook/react-vite';
import { BannerBenefit } from './BannerBenefit';

const meta = {
  title: 'Components/BannerBenefit',
  component: BannerBenefit,
  tags: ['autodocs'],
  parameters: { layout: 'centered', backgrounds: { default: 'light' } },
} satisfies Meta<typeof BannerBenefit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomText: Story = {
  args: {
    text: '최대 30% 적립 T 멤버십 프리미엄 카드',
  },
};
