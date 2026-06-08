import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonSection } from './ButtonSection';

const meta = {
  title: 'Components/ButtonSection',
  component: ButtonSection,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ButtonSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Custom: Story = {
  args: {
    leftLabel: 'T 가족모아데이터',
    rightLabel: '데이터 함께 쓰기',
  },
};
