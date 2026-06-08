import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout } from './Callout';

const meta = {
  title: 'Components/Callout',
  component: Callout,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTitle: Story = {
  args: { title: '타이틀', children: '구독 주기마다 요금이 정기 결제돼요.' },
};

export const BodyOnly: Story = {
  args: { children: '구독 주기마다 요금이 정기 결제돼요.' },
};
