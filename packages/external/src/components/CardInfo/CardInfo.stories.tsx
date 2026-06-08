import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardInfo } from './CardInfo';

const meta = {
  title: 'Components/CardInfo',
  component: CardInfo,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CardInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Brand: Story = {
  args: { type: 'Brand' },
};

export const Place: Story = {
  args: { type: 'Place' },
};
