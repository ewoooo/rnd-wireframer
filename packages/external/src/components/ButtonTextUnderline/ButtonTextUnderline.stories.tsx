import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonTextUnderline } from './ButtonTextUnderline';

const meta = {
  title: 'Components/ButtonTextUnderline',
  component: ButtonTextUnderline,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Meta<typeof ButtonTextUnderline>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Figma: .ButtonTextUnderline (24×17) ──────────────────────────────────────
export const Default: Story = {
  args: { label: 'Text' },
};

// ── 실사용 예시 ───────────────────────────────────────────────────────────────
export const UsageExamples: Story = {
  name: 'Usage Examples',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
      <ButtonTextUnderline label="전체보기" />
      <ButtonTextUnderline label="더보기" />
      <ButtonTextUnderline label="약관 보기" />
      <ButtonTextUnderline label="개인정보 처리방침" />
    </div>
  ),
};

// ── 색상 변형 ─────────────────────────────────────────────────────────────────
export const Colors: Story = {
  name: 'Color Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
      <ButtonTextUnderline label="기본 (50% Dark)" />
      <ButtonTextUnderline label="Primary" color="#3617ce" />
      <ButtonTextUnderline label="Dark" color="rgba(6,12,31,1)" />
    </div>
  ),
};

// ── 컨텍스트: 카드 하단 링크 ─────────────────────────────────────────────────
export const InCard: Story = {
  name: 'In Card Context',
  render: () => (
    <div style={{
      width: 353,
      padding: '16px 20px',
      background: '#f4f5fa',
      borderRadius: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <p style={{ margin: 0, fontSize: 14, color: 'rgba(6,12,31,0.6)', lineHeight: 1.4 }}>
        이용약관 및 개인정보 처리방침에 동의합니다.
      </p>
      <ButtonTextUnderline label="약관 보기" />
    </div>
  ),
};
