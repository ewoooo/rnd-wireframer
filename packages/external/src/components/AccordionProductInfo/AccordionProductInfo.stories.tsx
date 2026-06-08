import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccordionProductInfo } from './AccordionProductInfo';

const meta = {
  title: 'Components/AccordionProductInfo',
  component: AccordionProductInfo,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    states: { control: 'radio', options: ['Default', 'Open'] },
  },
} satisfies Meta<typeof AccordionProductInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { states: 'Default' },
};

export const Open: Story = {
  args: { states: 'Open' },
};
