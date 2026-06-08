import type { Meta, StoryObj } from '@storybook/react-vite';
import { Thumbnail } from './Thumbnail';

const meta = {
  title: 'Components/Thumbnail',
  component: Thumbnail,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    type: { control: 'radio', options: ['Product', 'Brand'] },
    activeDotIndex: { control: { type: 'number', min: 0, max: 3 } },
    totalDots: { control: { type: 'number', min: 1, max: 6 } },
  },
} satisfies Meta<typeof Thumbnail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Product: Story = {
  args: { type: 'Product', totalDots: 4, activeDotIndex: 0 },
};

export const ProductDot2: Story = {
  args: { type: 'Product', totalDots: 4, activeDotIndex: 1 },
};

export const Brand: Story = {
  args: { type: 'Brand' },
};
