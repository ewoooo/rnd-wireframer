import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActionButton } from './ActionButton';

const meta = {
  title: 'Components/ActionButton',
  component: ActionButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    type: { control: 'select', options: ['Default', 'Ai', 'Gift'] },
    button: { control: 'select', options: ['1', '2'] },
  },
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Ai + button=2 (기본) ─────────────────────────────────────────────────
export const AiButton2: Story = {
  name: 'Ai / button=2',
  args: {
    type: 'Ai',
    button: '2',
    showText: true,
    topText: '텍스트',
    leftText: '텍스트',
    rightText: '텍스트',
  },
};

// ── Ai + button=1 (툴팁 + LeftItem 활용) ─────────────────────────────────
export const AiButton1: Story = {
  name: 'Ai / button=1 (LeftItem 활용)',
  args: {
    type: 'Ai',
    button: '1',
    showTooltip: true,
    tooltipText: '56만원의 T 안심보상가 적용이 대기 중이에요!',
    buttonText: '맞춤 옵션 바로 선택하기',
  },
  parameters: { layout: 'padded' },
};

// ── Default + button=1 ───────────────────────────────────────────────────
export const DefaultButton1: Story = {
  name: 'Default / button=1',
  args: {
    type: 'Default',
    button: '1',
    primaryText: '버튼',
  },
};

// ── Default + button=2 ───────────────────────────────────────────────────
export const DefaultButton2: Story = {
  name: 'Default / button=2',
  args: {
    type: 'Default',
    button: '2',
    showText: true,
    priceLabel: '이용 금액',
    period: '1개월/',
    price: '7,900원',
    secondaryText: '버튼',
    primaryText: '버튼',
  },
};

// ── Gift + button=1 (툴팁) ───────────────────────────────────────────────
export const GiftButton1: Story = {
  name: 'Gift / button=1',
  args: {
    type: 'Gift',
    button: '1',
    showTooltip: true,
    tooltipText: '선물가 14,900원',
    leftText: '선물하기',
    rightText: '구독하기',
  },
  parameters: { layout: 'padded' },
};

// ── 전체 변형 한눈에 보기 ─────────────────────────────────────────────────
export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, paddingTop: 48 }}>
      <ActionButton type="Ai" button="2" showText topText="텍스트" leftText="텍스트" rightText="텍스트" />
      <ActionButton type="Ai" button="1" showTooltip tooltipText="56만원의 T 안심보상가 적용이 대기 중이에요!" buttonText="맞춤 옵션 바로 선택하기" />
      <ActionButton type="Gift" button="1" showTooltip tooltipText="선물가 14,900원" leftText="선물하기" rightText="구독하기" />
      <ActionButton type="Default" button="1" primaryText="버튼" />
      <ActionButton type="Default" button="2" showText priceLabel="이용 금액" period="1개월/" price="7,900원" secondaryText="버튼" primaryText="버튼" />
    </div>
  ),
  parameters: { layout: 'padded' },
};
