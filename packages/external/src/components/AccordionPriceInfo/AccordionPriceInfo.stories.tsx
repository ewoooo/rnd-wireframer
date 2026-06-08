import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccordionPriceInfo } from './AccordionPriceInfo';

const meta = {
  title: 'Components/AccordionPriceInfo',
  component: AccordionPriceInfo,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    states: { control: 'radio', options: ['Default', 'Open'] },
    type: { control: 'radio', options: ['SelectedList', 'TextList'] },
  },
} satisfies Meta<typeof AccordionPriceInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SelectedListDefault: Story = {
  args: { type: 'SelectedList', states: 'Default' },
};

export const SelectedListOpen: Story = {
  args: { type: 'SelectedList', states: 'Open' },
};

export const TextListDefault: Story = {
  args: { type: 'TextList', states: 'Default', title: '배송 정보', rightText: '배송비 3,000원' },
};

export const TextListOpen: Story = {
  args: { type: 'TextList', states: 'Open', title: '배송 정보', rightText: '배송비 3,000원' },
};
