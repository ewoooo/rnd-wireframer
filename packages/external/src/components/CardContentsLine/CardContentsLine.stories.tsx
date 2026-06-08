import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardContentsLine } from './CardContentsLine';

const meta = {
  title: 'Components/CardContentsLine',
  component: CardContentsLine,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CardContentsLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: '타이틀' },
};

export const WithCustomContent: Story = {
  render: () => (
    <CardContentsLine title="결제 정보">
      <div style={{ paddingBottom: 4, width: '100%', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#05001a', letterSpacing: '-0.56px' }}>상품 금액</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(6,12,31,0.6)', letterSpacing: '-0.56px' }}>18,000원</span>
      </div>
      <div style={{ height: 2 }} />
      <div style={{ paddingBottom: 4, width: '100%', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#05001a', letterSpacing: '-0.56px' }}>할인 금액</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(6,12,31,0.6)', letterSpacing: '-0.56px' }}>-9,900원</span>
      </div>
      <div style={{ height: 2 }} />
      <div style={{ paddingBottom: 4, width: '100%', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#05001a', letterSpacing: '-0.56px' }}>배송비</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(6,12,31,0.6)', letterSpacing: '-0.56px' }}>3,000원</span>
      </div>
    </CardContentsLine>
  ),
};
