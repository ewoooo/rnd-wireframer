import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';

const meta = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: { selected: { control: 'boolean' } },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default:  Story = { args: { selected: false, children: '단말기' } };
export const Selected: Story = { args: { selected: true,  children: '단말기' } };

export const ChipGroup: Story = {
  render: () => {
    const items = ['요금제', '단말기', '구독상품', '부가서비스'];
    const [active, setActive] = useState(0);
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {items.map((item, i) => (
          <Chip key={item} selected={active === i} onClick={() => setActive(i)}>
            {item}
          </Chip>
        ))}
      </div>
    );
  },
};

// ── Figma 9638-78472: 가로 스크롤 Row ───────────────────────────────────────
export const ScrollRow: Story = {
  name: 'Scroll Row (Figma 9638-78472)',
  render: () => {
    const items = ['전체', 'EAT', 'BUY', 'PLAY', '선불폰', '단말기'];
    const [active, setActive] = useState(0);
    return (
      <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingLeft: 20, paddingTop: 10, paddingBottom: 10, width: 393 }}>
        {items.map((item, i) => (
          <Chip key={item} selected={active === i} onClick={() => setActive(i)}>
            {item}
          </Chip>
        ))}
      </div>
    );
  },
};
