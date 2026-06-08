import type { Meta, StoryObj } from '@storybook/react-vite';
import { Indicator } from './Indicator';

const meta = {
  title: 'Components/Indicator',
  component: Indicator,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Indicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { count: 6, activeIndex: 0 },
};

export const MiddleActive: Story = {
  name: 'Active Index 2',
  args: { count: 6, activeIndex: 2 },
};

export const AllVariants: Story = {
  name: 'All Active Positions',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Indicator key={i} count={6} activeIndex={i} />
      ))}
    </div>
  ),
};
