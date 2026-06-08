import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductInfoHorizontal } from './ProductInfoHorizontal';

const meta = {
  title: 'Components/ProductInfoHorizontal',
  component: ProductInfoHorizontal,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ProductInfoHorizontal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    subtitle: '서브타이틀',
    mainText: '메인 텍스트',
    subText: '서브 텍스트',
    discountLabel: '최대할인',
    discountAmount: '- 999,999원',
  },
};
