import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxItem, CheckboxText } from './Checkbox';

const meta = {
  title: 'Components/Checkbox',
  component: CheckboxText,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CheckboxText>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── CheckboxItem — 4 states ───────────────────────────────────────────────────
export const ItemAllStates: Story = {
  name: 'CheckboxItem — All States',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <CheckboxItem checked={false} disabled={false} />
      <CheckboxItem checked={false} disabled={true} />
      <CheckboxItem checked={true}  disabled={false} />
      <CheckboxItem checked={true}  disabled={true} />
    </div>
  ),
};

// ── CheckboxText — 4 states ───────────────────────────────────────────────────
export const TextAllStates: Story = {
  name: 'CheckboxText — All States',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CheckboxText label="텍스트" checked={false} disabled={false} />
      <CheckboxText label="텍스트" checked={false} disabled={true} />
      <CheckboxText label="텍스트" checked={true}  disabled={false} />
      <CheckboxText label="텍스트" checked={true}  disabled={true} />
    </div>
  ),
};

// ── 인터랙티브 체크박스 그룹 ──────────────────────────────────────────────────
export const CheckboxGroup: Story = {
  name: 'Interactive Checkbox Group',
  render: () => {
    const [checked, setChecked] = useState<Record<string, boolean>>({ sms: true });
    const options = [
      { key: 'sms', label: 'SMS 수신 동의' },
      { key: 'push', label: '푸시 알림 동의' },
      { key: 'email', label: '이메일 수신 동의' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 200 }}>
        {options.map((opt) => (
          <CheckboxText
            key={opt.key}
            label={opt.label}
            checked={!!checked[opt.key]}
            onChange={(v) => setChecked((prev) => ({ ...prev, [opt.key]: v }))}
          />
        ))}
        <CheckboxText label="비활성 항목" checked={false} disabled={true} />
      </div>
    );
  },
};
