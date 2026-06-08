import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sheet } from './Sheet';

const meta = {
  title: 'Components/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomProduct: Story = {
  args: {
    productName: 'Galaxy S25 Ultra 티타늄 블랙 256G',
    price: '89,900원',
    priceUnit: '/월',
    priceNote: '(부가세, 할부수수료 포함)',
  },
};
