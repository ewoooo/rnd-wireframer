import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { UnderlineTab } from './UnderlineTab';

const meta = {
  title: 'Components/UnderlineTab',
  component: UnderlineTab,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof UnderlineTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstActive: Story = {
  args: { items: ['상품 정보', '사용 방법'], activeIndex: 0 },
};

export const SecondActive: Story = {
  args: { items: ['상품 정보', '사용 방법'], activeIndex: 1 },
};

export const Interactive: Story = {
  render: () => {
    const [active, setActive] = useState(0);
    return <UnderlineTab items={['상품 정보', '사용 방법']} activeIndex={active} onChange={setActive} />;
  },
};
