import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonMoreProductItem } from './ButtonMoreProductItem';

const meta = {
  title: 'Components/ButtonMoreProductItem',
  component: ButtonMoreProductItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    logoColor: { control: 'color' },
  },
} satisfies Meta<typeof ButtonMoreProductItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Figma: .ButtonMoreProductItem (329×48) ───────────────────────────────────
export const Default: Story = {
  args: {
    label: 'Gifticon Best 상품 더보기',
    logoColor: '#dad2ff',
  },
  decorators: [(Story) => <div style={{ width: 329 }}><Story /></div>],
};

// ── 다양한 카테고리 ────────────────────────────────────────────────────────────
export const Variants: Story = {
  name: 'Category Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 329 }}>
      <ButtonMoreProductItem label="Gifticon Best 상품 더보기" logoColor="#dad2ff" />
      <ButtonMoreProductItem label="5G 요금제 전체보기" logoColor="#d2e8ff" />
      <ButtonMoreProductItem label="AI 서비스 더보기" logoColor="#d2ffd6" />
      <ButtonMoreProductItem label="구독 서비스 전체보기" logoColor="#ffd2d2" />
    </div>
  ),
};

// ── 리스트 하단 컨텍스트 ──────────────────────────────────────────────────────
export const InList: Story = {
  name: 'In List Context',
  render: () => (
    <div style={{ width: 393, background: '#f4f5fa', padding: '12px 20px' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: 16, background: '#ffffff', borderRadius: 16,
      }}>
        {['이달의 Best 기프티콘', '새로 나온 인기 상품'].map((label, i, arr) => (
          <div key={label} style={{
            padding: '12px 0',
            borderBottom: i < arr.length - 1 ? '1px solid rgba(6,12,31,0.06)' : undefined,
            fontSize: 14, color: '#05001a',
          }}>
            {label}
          </div>
        ))}
        <div style={{ paddingTop: 8 }}>
          <ButtonMoreProductItem label="Gifticon Best 상품 더보기" logoColor="#dad2ff" />
        </div>
      </div>
    </div>
  ),
  parameters: { layout: 'fullscreen' },
};
