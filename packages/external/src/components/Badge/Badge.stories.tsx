import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['gray', 'black', 'blue'] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gray:  Story = { args: { variant: 'gray',  children: 'Badge' } };
export const Black: Story = { args: { variant: 'black', children: 'Badge' } };
export const Blue:  Story = { args: { variant: 'blue',  children: 'Badge' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Badge variant="gray">Gray</Badge>
      <Badge variant="black">Black</Badge>
      <Badge variant="blue">Blue</Badge>
    </div>
  ),
};
