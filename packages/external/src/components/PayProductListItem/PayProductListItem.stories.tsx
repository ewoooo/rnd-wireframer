import type { Meta, StoryObj } from '@storybook/react-vite';
import { PayProductListItem } from './PayProductListItem';

const meta = {
  title: 'Components/PayProductListItem',
  component: PayProductListItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: { type: { control: 'select', options: ['Pay', 'Cart'] } },
} satisfies Meta<typeof PayProductListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pay: Story = {
  args: { type: 'Pay' },
};

export const Cart: Story = {
  args: { type: 'Cart' },
};

export const PayNoBox: Story = {
  args: { type: 'Pay', showBox: false },
};

export const CartNoBox: Story = {
  args: { type: 'Cart', showBox: false },
};
