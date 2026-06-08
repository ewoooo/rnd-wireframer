import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioItem, RadioText } from './Radio';

const meta = {
  title: 'Components/Radio',
  component: RadioText,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof RadioText>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── RadioItem — 4 states ──────────────────────────────────────────────────────
export const ItemAllStates: Story = {
  name: 'RadioItem — All States',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <RadioItem checked={false} disabled={false} />
      <RadioItem checked={false} disabled={true} />
      <RadioItem checked={true}  disabled={false} />
      <RadioItem checked={true}  disabled={true} />
    </div>
  ),
};

// ── RadioText — 4 states ──────────────────────────────────────────────────────
export const TextAllStates: Story = {
  name: 'RadioText — All States',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <RadioText label="텍스트" checked={false} disabled={false} />
      <RadioText label="텍스트" checked={false} disabled={true} />
      <RadioText label="텍스트" checked={true}  disabled={false} />
      <RadioText label="텍스트" checked={true}  disabled={true} />
    </div>
  ),
};

// ── 인터랙티브 라디오 그룹 ────────────────────────────────────────────────────
export const RadioGroup: Story = {
  name: 'Interactive Radio Group',
  render: () => {
    const [value, setValue] = useState('option1');
    const options = [
      { key: 'option1', label: '월정액 요금제' },
      { key: 'option2', label: '선불 요금제' },
      { key: 'option3', label: '데이터 전용' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 200 }}>
        {options.map((opt) => (
          <RadioText
            key={opt.key}
            label={opt.label}
            checked={value === opt.key}
            onChange={() => setValue(opt.key)}
          />
        ))}
        <RadioText label="비활성 항목" checked={false} disabled={true} />
      </div>
    );
  },
};
