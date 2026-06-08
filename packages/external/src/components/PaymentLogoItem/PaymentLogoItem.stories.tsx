import type { Meta, StoryObj } from '@storybook/react-vite';
import { PaymentLogoItem } from './PaymentLogoItem';

const meta = {
  title: 'Components/PaymentLogoItem',
  component: PaymentLogoItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof PaymentLogoItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ElevenPay: Story = {
  name: '11pay',
  args: { type: '11pay' },
};

export const KakaoPay: Story = {
  name: '카카오페이',
  args: { type: 'kakaopay' },
};

export const NaverPay: Story = {
  name: '네이버페이',
  args: { type: 'naverpay' },
};

export const AllTypes: Story = {
  name: 'All Types',
  render: () => (
    <div style={{ display: 'flex', gap: 8, padding: 16, background: '#f4f5fa', borderRadius: 12 }}>
      <PaymentLogoItem type="11pay" />
      <PaymentLogoItem type="kakaopay" />
      <PaymentLogoItem type="naverpay" />
    </div>
  ),
};
