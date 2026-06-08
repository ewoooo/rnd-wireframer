import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextButton } from './TextButton';

const meta = {
  title: 'Components/TextButton',
  component: TextButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TextButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Figma: Property 1=Default (28×21) ───────────────────────────────────────
export const Default: Story = {
  name: 'Property 1=Default',
  args: { label: '버튼', color: '#ffffff' },
  parameters: { backgrounds: { default: 'dark' } },
};

// ── Figma: Property 1=Variant2 (97×22) ──────────────────────────────────────
export const Double: Story = {
  name: 'Property 1=Variant2',
  args: { type: 'double', leftLabel: '버튼', rightLabel: '버튼', color: '#ffffff' },
  parameters: { backgrounds: { default: 'dark' } },
};

