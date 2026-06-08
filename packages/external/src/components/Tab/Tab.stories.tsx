import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tab } from './Tab';

const meta = {
  title: 'Components/Tab',
  component: Tab,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Tab>;

export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS = [
  { key: 'all', label: '전체' },
  { key: 'my', label: '나의 혜택' },
  { key: 'store', label: '스토어' },
];

export const Default: Story = {
  args: { items: ITEMS, activeKey: 'all', onChange: () => {} },
};

export const Interactive: Story = {
  render: () => {
    const [active, setActive] = useState('all');
    return <Tab items={ITEMS} activeKey={active} onChange={setActive} />;
  },
};

export const ManyItems: Story = {
  render: () => {
    const [active, setActive] = useState('tab1');
    const items = [
      { key: 'tab1', label: '혜택' },
      { key: 'tab2', label: '구독' },
      { key: 'tab3', label: '이용내역' },
      { key: 'tab4', label: '설정' },
      { key: 'tab5', label: '공지사항' },
    ];
    return <Tab items={items} activeKey={active} onChange={setActive} />;
  },
};
