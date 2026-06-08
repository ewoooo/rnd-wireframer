import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TailCenter: Story = {
  name: 'Tail Center',
  args: { label: '이 상품이 가장 인기있어요!', tailPosition: 'center' },
};

export const TailLeft: Story = {
  name: 'Tail Left',
  args: { label: '이 상품이 가장 인기있어요!', tailPosition: 'left' },
};

export const TailRight: Story = {
  name: 'Tail Right',
  args: { label: '이 상품이 가장 인기있어요!', tailPosition: 'right' },
};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, background: '#f4f5fa', borderRadius: 16 }}>
      <Tooltip label="이 상품이 가장 인기있어요!" tailPosition="left" />
      <Tooltip label="이 상품이 가장 인기있어요!" tailPosition="center" />
      <Tooltip label="이 상품이 가장 인기있어요!" tailPosition="right" />
    </div>
  ),
};
