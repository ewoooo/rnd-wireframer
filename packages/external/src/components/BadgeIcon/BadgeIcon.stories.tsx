import type { Meta, StoryObj } from '@storybook/react-vite';
import { BadgeIcon } from './BadgeIcon';

// 예시 아이콘 (단순 원형 placeholder)
function SampleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect width="16" height="16" rx="4" fill="#E2E6F1" />
      <rect x="4" y="9" width="2" height="3" rx="1" fill="#3617CE" />
      <rect x="7" y="7" width="2" height="5" rx="1" fill="#3617CE" />
      <rect x="10" y="5" width="2" height="7" rx="1" fill="#3617CE" />
    </svg>
  );
}

const meta = {
  title: 'Components/BadgeIcon',
  component: BadgeIcon,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof BadgeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Figma: Subtext=Off (68×28) ───────────────────────────────────────────────
export const SubtextOff: Story = {
  name: 'Subtext=Off',
  args: { icon: <SampleIcon />, label: '인기순' },
};

// ── Figma: Subtext=On (274×28) ───────────────────────────────────────────────
export const SubtextOn: Story = {
  name: 'Subtext=On',
  args: { icon: <SampleIcon />, label: '인기순', subLabel: '월정액 기준' },
};

// ── 두 상태 나란히 ─────────────────────────────────────────────────────────────
export const BothVariants: Story = {
  name: 'Both Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, background: '#f4f5fa', borderRadius: 12 }}>
      <BadgeIcon icon={<SampleIcon />} label="인기순" />
      <BadgeIcon icon={<SampleIcon />} label="인기순" subLabel="월정액 기준" />
    </div>
  ),
};

// ── 카드 컨텍스트 ─────────────────────────────────────────────────────────────
export const InCard: Story = {
  name: 'In Card Context',
  render: () => (
    <div style={{ width: 353, padding: 20, background: '#f4f5fa', borderRadius: 16 }}>
      <BadgeIcon icon={<SampleIcon />} label="5G 요금제" subLabel="월 55,000원부터" />
    </div>
  ),
};
