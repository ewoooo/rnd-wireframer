import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListProductVertical } from './ListProductVertical';

const meta = {
  title: 'Components/ListProductVertical',
  component: ListProductVertical,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ListProductVertical>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    subTitle: 'TextSub',
    title: 'TextMain',
    originalPrice: '999,999원',
    discountRate: '7%',
    price: '999,999원',
    priceUnit: '/12개월',
    badges: ['Badge', 'Badge', 'Badge'],
  },
};

export const NoDiscount: Story = {
  args: {
    subTitle: 'TextSub',
    title: 'TextMain',
    price: '999,999원',
    priceUnit: '/월',
    badges: ['Badge'],
  },
};
