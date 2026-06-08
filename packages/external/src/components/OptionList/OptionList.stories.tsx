import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { OptionList } from './OptionList';

const meta = {
  title: 'Components/OptionList',
  component: OptionList,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof OptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ColorSelected: Story = {
  args: {
    type: 'color',
    options: [{ label: '코발트 바이올렛' }, { label: '코발트 바이올렛' }],
    activeIndex: 0,
  },
};

export const ColorInteractive: Story = {
  render: () => {
    const [active, setActive] = useState(0);
    return (
      <OptionList
        type="color"
        options={[{ label: '코발트 바이올렛' }, { label: '내추럴 화이트' }]}
        activeIndex={active}
        onChange={setActive}
      />
    );
  },
};

export const ColorWithSubText: Story = {
  args: {
    type: 'color',
    options: [
      { label: '코발트 바이올렛', subText: '평일 기준\n18시 주문까지 가능' },
      { label: '내추럴 화이트', subText: '평일 기준\n18시 주문까지 가능' },
    ],
    activeIndex: 0,
  },
};

export const VolumeSelected: Story = {
  args: {
    type: 'volume',
    options: [
      { value: '256', unit: 'GB', badge: 'AI 추천', price: '1,254,000원' },
      { value: '512', unit: 'GB', badge: 'AI 추천', price: '1,454,000원' },
    ],
    activeIndex: 0,
  },
};

export const VolumeInteractive: Story = {
  render: () => {
    const [active, setActive] = useState(0);
    return (
      <OptionList
        type="volume"
        options={[
          { value: '256', unit: 'GB', badge: 'AI 추천', price: '1,254,000원' },
          { value: '512', unit: 'GB', price: '1,454,000원' },
        ]}
        activeIndex={active}
        onChange={setActive}
      />
    );
  },
};
