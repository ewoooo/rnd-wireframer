import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChipImageItem, TerminalIcon } from './ChipImageItem';

const meta = {
  title: 'Components/ChipImageItem',
  component: ChipImageItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    selected: { control: 'boolean' },
  },
} satisfies Meta<typeof ChipImageItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Figma: Selected=Off (selected, purple) ───────────────────────────────────
export const Selected: Story = {
  name: 'Selected=Off (Active)',
  args: { label: '단말기', selected: true },
};

// ── Figma: Selected=On (default, white) ──────────────────────────────────────
export const Default: Story = {
  name: 'Selected=On (Default)',
  args: { label: '단말기', selected: false },
};

// ── 두 상태 나란히 ─────────────────────────────────────────────────────────────
export const BothStates: Story = {
  name: 'Both States',
  render: () => (
    <div style={{ display: 'flex', gap: 8, padding: 16, background: '#f4f5fa', borderRadius: 12 }}>
      <ChipImageItem label="단말기" selected={true} />
      <ChipImageItem label="단말기" selected={false} />
    </div>
  ),
};

// ── 인터랙티브 필터 그룹 ──────────────────────────────────────────────────────
export const FilterGroup: Story = {
  name: 'Interactive Filter Group',
  render: () => {
    const [selected, setSelected] = useState<string>('단말기');
    const items = ['단말기', '기프트', '약정', '기간', '혜택'];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 16, background: '#f4f5fa', borderRadius: 12, maxWidth: 360 }}>
        {items.map((item) => (
          <ChipImageItem
            key={item}
            label={item}
            selected={selected === item}
            onClick={() => setSelected(item)}
          />
        ))}
      </div>
    );
  },
};

// ── Figma 9137-100849: 가로 스크롤 Row ──────────────────────────────────────
export const ScrollRow: Story = {
  name: 'Scroll Row (Figma 9137-100849)',
  render: () => {
    const [selected, setSelected] = useState<string>('단말기');
    const items = [
      { label: '단말기', icon: <TerminalIcon /> },
      { label: '모바일 요금제', icon: <TerminalIcon /> },
      { label: '혜택 구매', icon: <TerminalIcon /> },
      { label: '구독 상품', icon: <TerminalIcon /> },
    ];
    return (
      <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingLeft: 20, paddingTop: 10, paddingBottom: 10, width: 393 }}>
        {items.map((item) => (
          <ChipImageItem
            key={item.label}
            label={item.label}
            icon={item.icon}
            selected={selected === item.label}
            onClick={() => setSelected(item.label)}
          />
        ))}
      </div>
    );
  },
};
