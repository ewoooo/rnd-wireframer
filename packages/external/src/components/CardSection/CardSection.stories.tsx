import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardSection } from './CardSection';

const meta = {
  title: 'Components/CardSection',
  component: CardSection,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CardSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {
  args: {
    type: 'Medium',
    subtitle: '서브타이틀',
    title: '타이틀',
    badge: 'Badge',
    itemTitle: '왕과 사는 남자',
    itemSubtext: 'VVIP CGV 1인 무료 이용',
    itemButtonText: '버튼',
  },
};

export const Large: Story = {
  args: {
    type: 'Large',
    subtitle: '서브타이틀',
    title: '타이틀',
    aiText: 'T 멤버십 사용 가능 포인트 65,300P',
    buttonText: '버튼',
  },
};
