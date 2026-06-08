import type { Meta, StoryObj } from '@storybook/react-vite';
import { CarouselProductText } from './CarouselProductText';

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

const sampleBadges = [
  { icon: <SampleIcon />, label: '인기순', subLabel: '월정액 기준' },
  { icon: <SampleIcon />, label: '최신순', subLabel: '출시일 기준' },
  { icon: <SampleIcon />, label: '혜택순', subLabel: '할인 혜택 기준' },
];

const meta = {
  title: 'Components/CarouselProductText',
  component: CarouselProductText,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CarouselProductText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    subtitle: '배달의민족 × SKT',
    title: '배민 라이더스 패키지',
    description: '배달 할인 + 데이터 무제한',
    badges: sampleBadges,
  },
};

export const WithoutBadges: Story = {
  name: 'Without Badges',
  args: {
    subtitle: 'T우주 × 넷플릭스',
    title: '월정액 스트리밍 혜택',
  },
};
