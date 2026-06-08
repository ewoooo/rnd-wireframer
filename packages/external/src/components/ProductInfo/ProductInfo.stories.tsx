import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductInfo } from './ProductInfo';

const meta = {
  title: 'Components/ProductInfo',
  component: ProductInfo,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    showBadge: { control: 'boolean' },
    showButton: { control: 'boolean' },
    showDiscountPercentage: { control: 'boolean' },
    showOriginalPrice: { control: 'boolean' },
    showUsage: { control: 'boolean' },
  },
} satisfies Meta<typeof ProductInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showBadge: true,
    showButton: true,
    showDiscountPercentage: true,
    showOriginalPrice: true,
    showUsage: true,
  },
};

export const NoBadge: Story = {
  args: { showBadge: false, showButton: true, showDiscountPercentage: true, showOriginalPrice: true, showUsage: true },
};

export const NoButton: Story = {
  args: { showBadge: true, showButton: false, showDiscountPercentage: true, showOriginalPrice: true, showUsage: true },
};

export const PriceOnly: Story = {
  args: { showBadge: false, showButton: false, showDiscountPercentage: false, showOriginalPrice: false, showUsage: false },
};

export const NoUsage: Story = {
  args: { showBadge: true, showButton: true, showDiscountPercentage: true, showOriginalPrice: true, showUsage: false },
};
