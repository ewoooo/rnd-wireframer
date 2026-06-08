import type { Meta, StoryObj } from '@storybook/react-vite';
import { TitleContentsRightItem } from './TitleContentsRightItem';

const meta = {
  title: 'Components/TitleContentsRightItem',
  component: TitleContentsRightItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    type: { control: 'select', options: ['icon', 'button'] },
  },
} satisfies Meta<typeof TitleContentsRightItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Icon: Story = { args: { type: 'icon' } };

export const ButtonType: Story = {
  name: 'Button',
  args: { type: 'button', label: '버튼' },
};

export const AllTypes: Story = {
  name: 'All Types',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 16 }}>
      <TitleContentsRightItem type="icon" />
      <TitleContentsRightItem type="button" label="버튼" />
    </div>
  ),
};
