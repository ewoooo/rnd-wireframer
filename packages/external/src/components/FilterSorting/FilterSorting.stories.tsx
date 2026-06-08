import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterSorting } from './FilterSorting';

const meta = {
  title: 'Components/FilterSorting',
  component: FilterSorting,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FilterSorting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoDivider: Story = {
  args: { showDivider: false },
};

export const CustomCount: Story = {
  args: { totalCount: 42, sortLabel: '최신순' },
};
