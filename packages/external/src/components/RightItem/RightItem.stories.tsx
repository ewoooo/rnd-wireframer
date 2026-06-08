import type { Meta, StoryObj } from '@storybook/react-vite';
import { RightItem } from './RightItem';

const meta = {
  title: 'Components/RightItem',
  component: RightItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    type: { control: 'select', options: ['text', 'textButton', 'icon', 'badgeLevel'] },
  },
} satisfies Meta<typeof RightItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = { args: { type: 'text', label: '-3,000원' } };
export const TextButton: Story = { args: { type: 'textButton', label: '-3,000원' } };
export const Icon: Story = { args: { type: 'icon' } };
export const BadgeLevel: Story = { args: { type: 'badgeLevel' } };

export const AllTypes: Story = {
  name: 'All Types',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 16 }}>
      <RightItem type="text" label="-3,000원" />
      <RightItem type="textButton" label="-3,000원" />
      <RightItem type="icon" />
      <RightItem type="badgeLevel" />
    </div>
  ),
};
