import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardSummary } from './CardSummary';

const meta = {
  title: 'Components/CardSummary',
  component: CardSummary,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CardSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    type: 'Text',
    subText: 'SubText',
    mainText: 'MainText',
    row1Title: 'TitleText',
    row1Info: 'InfoText',
    row2Title: 'TitleText',
    row2Info: 'InfoText',
  },
};

export const TextWithRightItem: Story = {
  args: {
    type: 'Text+RightItem',
    subText: 'SubText',
    mainText: 'MainText',
    row1Title: 'TitleText',
    row1Info: 'InfoText',
    row2Title: 'TitleText',
    row2Info: 'InfoText',
    buttonText: '버튼',
  },
};

export const Button: Story = {
  args: {
    type: 'Button',
  },
};
