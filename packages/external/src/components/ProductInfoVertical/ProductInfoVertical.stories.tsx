import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductInfoVertical } from './ProductInfoVertical';

const meta = {
  title: 'Components/ProductInfoVertical',
  component: ProductInfoVertical,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ProductInfoVertical>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    textSub: 'TextSub',
    textMain: 'TextMain',
    originalPrice: '999,999원',
    discountRate: '7%',
    price: '999,999원',
    priceSuffix: '/12개월',
  },
};
