import type { Meta, StoryObj } from '@storybook/react-vite';
import { CarouselProduct } from './CarouselProduct';

const meta = {
  title: 'Components/CarouselProduct',
  component: CarouselProduct,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CarouselProduct>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    subTitle: 'T우주',
    title: '5G 프리미어 플러스',
    originalPrice: '130,000원',
    discountRate: '57%',
    price: '55,000원',
    priceUnit: '/월',
    badges: ['인기', '추천'],
  },
};

export const Carousel: Story = {
  name: 'Carousel Row',
  render: () => (
    <div style={{ display: 'flex', gap: 8, padding: 16 }}>
      {[
        { subTitle: 'T우주', title: '5G 프리미어 플러스', originalPrice: '130,000원', discountRate: '57%', price: '55,000원', priceUnit: '/월', badges: ['인기', '추천'] },
        { subTitle: 'T다이렉트샵', title: '5GX 플래티넘', originalPrice: '95,000원', discountRate: '7%', price: '89,000원', priceUnit: '/12개월', badges: ['NEW'] },
        { subTitle: 'T멤버십', title: '데이터 온 안심', originalPrice: '45,000원', discountRate: '11%', price: '39,900원', priceUnit: '/월', badges: ['할인', '인기'] },
      ].map((p, i) => (
        <CarouselProduct key={i} {...p} />
      ))}
    </div>
  ),
};
