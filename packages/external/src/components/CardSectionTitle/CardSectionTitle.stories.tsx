import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardSectionTitle } from './CardSectionTitle';

const meta = {
  title: 'Components/CardSectionTitle',
  component: CardSectionTitle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CardSectionTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    subtitle: '서브타이틀',
    title: '타이틀',
    badge: 'Badge',
  },
};
