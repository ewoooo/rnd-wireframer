import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchBar } from './SearchBar';

const meta = {
  title: 'Components/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: { type: { control: 'select', options: ['LLM', 'search'] } },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LLM: Story = {
  args: { type: 'LLM' },
};

export const Search: Story = {
  args: { type: 'search' },
};

export const BothTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SearchBar type="LLM" />
      <SearchBar type="search" />
    </div>
  ),
};
