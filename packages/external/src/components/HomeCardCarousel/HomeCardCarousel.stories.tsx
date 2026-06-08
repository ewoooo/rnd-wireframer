import type { Meta, StoryObj } from '@storybook/react-vite';
import { HomeCardCarousel } from './HomeCardCarousel';

const meta = {
  title: 'Components/HomeCardCarousel',
  component: HomeCardCarousel,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof HomeCardCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    subtitle: '서브 타이틀',
    titleLine1: '메인 타이틀',
    titleLine2: '메인 타이틀',
  },
};

export const WithSlotContent: Story = {
  render: () => (
    <HomeCardCarousel subtitle="이달의 혜택" titleLine1="지금 바로 구독하고" titleLine2="혜택을 누려보세요">
      <div style={{
        width: '100%',
        height: '100%',
        background: '#f4f5fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        color: 'rgba(6,12,31,0.4)',
      }}>
        캐러셀 슬롯 (268px)
      </div>
    </HomeCardCarousel>
  ),
};
