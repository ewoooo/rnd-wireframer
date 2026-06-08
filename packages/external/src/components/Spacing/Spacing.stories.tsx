import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spacing } from './Spacing';

const meta = {
  title: 'Components/Spacing',
  component: Spacing,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: [2, 4, 8, 12, 16, 20, 24, 28],
    },
  },
} satisfies Meta<typeof Spacing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Size2: Story = { args: { size: 2 } };
export const Size4: Story = { args: { size: 4 } };
export const Size8: Story = { args: { size: 8 } };
export const Size12: Story = { args: { size: 12 } };
export const Size16: Story = { args: { size: 16 } };
export const Size20: Story = { args: { size: 20 } };
export const Size24: Story = { args: { size: 24 } };
export const Size28: Story = { args: { size: 28 } };

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#f4f5fa', width: 393, padding: 20, boxSizing: 'border-box' }}>
      {([2, 4, 8, 12, 16, 20, 24, 28] as const).map((size) => (
        <div key={size} style={{ position: 'relative' }}>
          <div style={{ background: '#3617ce', opacity: 0.15, width: '100%', height: size }} />
          <span style={{ position: 'absolute', right: 4, top: 0, fontSize: 10, color: '#3617ce', lineHeight: `${size}px` }}>{size}px</span>
        </div>
      ))}
    </div>
  ),
};
