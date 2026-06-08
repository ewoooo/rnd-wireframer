import type { Meta, StoryObj } from '@storybook/react-vite';
import { TitleMain } from './TitleMain';

const meta = {
  title: 'Components/TitleMain',
  component: TitleMain,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: { type: { control: 'select', options: ['Complete', 'Search'] } },
} satisfies Meta<typeof TitleMain>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {
  args: { type: 'Complete' },
};

export const Search: Story = {
  args: {
    type: 'Search',
    title: '득템 찬스 T우주\n클럽클리오 쿠폰팩',
  },
};
