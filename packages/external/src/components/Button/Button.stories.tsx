import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant:   { control: 'select', options: ['primary', 'secondary', 'solid'] },
    size:      { control: 'select', options: ['xsmall', 'small', 'medium', 'large', 'xlarge'] },
    fullWidth: { control: 'boolean' },
    disabled:  { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story   = { args: { variant: 'primary',   size: 'medium', children: '버튼' } };
export const Secondary: Story = { args: { variant: 'secondary', size: 'medium', children: '버튼' } };
export const Disabled: Story  = { args: { variant: 'primary',   size: 'medium', children: '버튼', disabled: true } };

// ── XSmall Solid (Figma: .ButtonXsmallSolid — node 9743:57542) ──────────────
// Active: h=21, padding 4/7, bg=#05001A, text white 10px/600 + 12px icon
// Disabled: 동일 사이즈, bg=rgba(6,12,31,0.05), text=rgba(6,12,31,0.2)
function ArrowUpRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 9L9 3M9 3H4.5M9 3V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export const XSmallSolidActive: Story = {
  name: 'XSmall Solid — Active (쿠폰 받기)',
  args: {
    variant: 'solid',
    size: 'xsmall',
    children: '쿠폰 받기',
    rightIcon: <ArrowUpRightIcon />,
  },
};

export const XSmallSolidDisabled: Story = {
  name: 'XSmall Solid — Disabled (보유중)',
  args: {
    variant: 'solid',
    size: 'xsmall',
    children: '보유중',
    disabled: true,
  },
};

export const XSmallSolidBoth: Story = {
  name: 'XSmall Solid — Active & Disabled',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Button variant="solid" size="xsmall" rightIcon={<ArrowUpRightIcon />}>쿠폰 받기</Button>
      <Button variant="solid" size="xsmall" disabled>보유중</Button>
    </div>
  ),
};

export const XLargePrimary: Story = {
  name: 'XLarge Primary (with shadow)',
  args: { variant: 'primary', size: 'xlarge', children: '버튼' },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: 16 }}>
      <Button variant="solid" size="xsmall" rightIcon={<ArrowUpRightIcon />}>XSmall</Button>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
      <Button size="xlarge">XLarge</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 200 }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="solid">Solid</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </div>
  ),
};

export const FullWidth: Story = {
  args: { variant: 'primary', size: 'large', fullWidth: true, children: '요금제 신청하기' },
  parameters: { layout: 'padded' },
};
