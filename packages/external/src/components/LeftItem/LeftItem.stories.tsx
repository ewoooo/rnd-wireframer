import type { Meta, StoryObj } from '@storybook/react-vite';
import { LeftItem } from './LeftItem';

const meta = {
  title: 'Components/LeftItem',
  component: LeftItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    type: { control: 'select', options: ['ai', 'ai+gift'] },
    color: { control: 'color' },
  },
} satisfies Meta<typeof LeftItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Figma: Type=Ai+Gift (85×22) ─────────────────────────────────────────────
export const AiAndGift: Story = {
  name: 'Type=Ai+Gift',
  args: { type: 'ai+gift', color: '#ffffff' },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

// ── Figma: Type=Ai (43×22) ───────────────────────────────────────────────────
export const AiOnly: Story = {
  name: 'Type=Ai',
  args: { type: 'ai', color: '#ffffff' },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

