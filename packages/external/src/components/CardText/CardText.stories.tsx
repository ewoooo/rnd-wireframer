import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardText } from './CardText';

const meta = {
  title: 'Components/CardText',
  component: CardText,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CardText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    category: '편의점',
    name: '세븐일레븐',
    badges: ['할인', '적립', '사용'],
  },
};

export const SingleBadge: Story = {
  args: {
    category: '카페',
    name: '스타벅스',
    badges: ['할인'],
  },
};
