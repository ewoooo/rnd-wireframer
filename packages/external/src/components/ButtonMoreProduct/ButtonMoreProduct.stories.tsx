import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonMoreProduct } from './ButtonMoreProduct';

const meta = {
  title: 'Components/ButtonMoreProduct',
  component: ButtonMoreProduct,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ButtonMoreProduct>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Gifticon Best 상품 더보기', logoColor: '#dad2ff' },
};

export const CustomLabel: Story = {
  args: { label: '인기 상품 더보기', logoColor: '#ffd2d2' },
};
