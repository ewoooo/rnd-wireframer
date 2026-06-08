import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonListOrder } from './ButtonListOrder';

const meta = {
  title: 'Components/ButtonListOrder',
  component: ButtonListOrder,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: {
      control: 'select',
      options: ['인기순', '최신순', '낮은가격순', '높은가격순'],
    },
  },
} satisfies Meta<typeof ButtonListOrder>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Figma: .ButtonListOrder (54×18) ─────────────────────────────────────────
export const Default: Story = {
  args: { label: '인기순' },
};

// ── 정렬 옵션 전체 ────────────────────────────────────────────────────────────
export const AllOptions: Story = {
  name: 'Sort Options',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <ButtonListOrder label="인기순" />
      <ButtonListOrder label="최신순" />
      <ButtonListOrder label="낮은가격순" />
      <ButtonListOrder label="높은가격순" />
    </div>
  ),
};

// ── 리스트 헤더 컨텍스트 예시 ─────────────────────────────────────────────────
export const InListHeader: Story = {
  name: 'In List Header',
  render: () => (
    <div style={{ width: 393, background: '#ffffff' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        borderBottom: '1px solid rgba(6,12,31,0.08)',
      }}>
        <span style={{ fontSize: 13, color: 'rgba(6,12,31,0.5)' }}>총 24개</span>
        <ButtonListOrder label="인기순" />
      </div>
      <div style={{ padding: 20, color: 'rgba(6,12,31,0.3)', fontSize: 14, textAlign: 'center' }}>
        리스트 영역
      </div>
    </div>
  ),
  parameters: { layout: 'fullscreen' },
};
