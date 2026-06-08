import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListSelectedRightItem } from './ListSelectedRightItem';

const meta = {
  title: 'Components/ListSelectedRightItem',
  component: ListSelectedRightItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: { type: { control: 'select', options: ['buttonXsmallSolid', 'icon', 'textButton'] } },
} satisfies Meta<typeof ListSelectedRightItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonXsmallSolid: Story = { args: { type: 'buttonXsmallSolid', label: '받기' } };
export const Icon: Story = { args: { type: 'icon' } };
export const TextButton: Story = { args: { type: 'textButton', label: 'Text' } };

export const AllTypes: Story = {
  name: 'All Types',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 16 }}>
      <ListSelectedRightItem type="buttonXsmallSolid" label="받기" />
      <ListSelectedRightItem type="icon" />
      <ListSelectedRightItem type="textButton" label="Text" />
    </div>
  ),
};
