import type { Meta, StoryObj } from '@storybook/react-vite';
import { TitleContents } from './TitleContents';

const meta = {
  title: 'Components/TitleContents',
  component: TitleContents,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TitleContents>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: '타이틀', showButton: true },
};

export const NoButton: Story = {
  args: { title: '타이틀', showButton: false },
};
