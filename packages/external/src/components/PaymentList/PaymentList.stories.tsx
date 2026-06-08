import type { Meta, StoryObj } from '@storybook/react-vite';
import { PaymentList } from './PaymentList';

const meta = {
  title: 'Components/PaymentList',
  component: PaymentList,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof PaymentList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutCard: Story = {
  args: { showCard: false },
};

export const WithoutBadge: Story = {
  args: { badge: '' },
};
