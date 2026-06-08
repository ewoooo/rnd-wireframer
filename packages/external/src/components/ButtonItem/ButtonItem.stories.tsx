import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonItem } from './ButtonItem';

const meta = {
  title: 'Components/ButtonItem',
  component: ButtonItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ButtonItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'MY 편집' } };
export const CustomLabel: Story = { args: { label: '필터 초기화' } };
