import type { Meta, StoryObj } from '@storybook/react-vite';
import { TitleSectionLeftItem } from './TitleSectionLeftItem';

const meta = {
  title: 'Components/TitleSectionLeftItem',
  component: TitleSectionLeftItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    type: { control: 'select', options: ['text', 'icon', 'badge'] },
  },
} satisfies Meta<typeof TitleSectionLeftItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextType: Story = {
  name: 'Text (count)',
  args: { type: 'text', count: '2' },
};

export const IconType: Story = {
  name: 'Icon (info)',
  args: { type: 'icon' },
};

export const BadgeType: Story = {
  name: 'Badge',
  args: { type: 'badge', badge: 'Badge' },
};

export const AllTypes: Story = {
  name: 'All Types',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
      <TitleSectionLeftItem type="text" count="2" />
      <TitleSectionLeftItem type="icon" />
      <TitleSectionLeftItem type="badge" badge="Badge" />
    </div>
  ),
};
