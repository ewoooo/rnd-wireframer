import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListProductRow } from './ListProductRow';

const meta = {
  title: 'Components/ListProductRow',
  component: ListProductRow,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ListProductRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    left: {
      subTitle: 'T우주',
      title: '5G 프리미어 플러스',
      originalPrice: '130,000원',
      discountRate: '57%',
      price: '55,000원',
      priceUnit: '/월',
      badges: ['인기', '추천'],
    },
    right: {
      subTitle: 'T다이렉트샵',
      title: '5GX 플래티넘',
      originalPrice: '95,000원',
      discountRate: '7%',
      price: '89,000원',
      priceUnit: '/월',
      badges: ['NEW'],
    },
  },
};

export const MultipleRows: Story = {
  name: 'Multiple Rows',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, background: '#ffffff' }}>
      <ListProductRow
        left={{ subTitle: 'T우주', title: '5G 프리미어 플러스', originalPrice: '130,000원', discountRate: '57%', price: '55,000원', priceUnit: '/월', badges: ['인기'] }}
        right={{ subTitle: 'T다이렉트샵', title: '5GX 플래티넘', originalPrice: '95,000원', discountRate: '7%', price: '89,000원', priceUnit: '/월', badges: ['NEW'] }}
      />
      <ListProductRow
        left={{ subTitle: 'T멤버십', title: '데이터 온 안심', originalPrice: '45,000원', discountRate: '11%', price: '39,900원', priceUnit: '/월', badges: ['할인'] }}
        right={{ subTitle: 'T다이렉트샵', title: '베이직 5G', price: '33,000원', priceUnit: '/월', badges: ['추천'] }}
      />
    </div>
  ),
};
