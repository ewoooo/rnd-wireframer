import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './TextField';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    state: {
      control: 'select',
      options: ['default', 'focused', 'typing', 'typed', 'disabled'],
    },
    error: { control: 'boolean' },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── 인라인 버튼 ("모두 사용") ──────────────────────────
function InlineButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#e2e6f1',
        border: 'none',
        borderRadius: 16,
        height: 48,
        padding: '10px 16px',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        color: 'rgba(6,12,31,0.8)',
        letterSpacing: '-0.04em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </button>
  );
}

// ── Figma: States=Default, Error=off / Error=on ───────
export const Default: Story = {
  name: 'Default (Error=off)',
  args: { label: '레이블', placeholder: '텍스트를 입력하세요', helperText: 'Help Text' },
};

export const DefaultError: Story = {
  name: 'Default (Error=on)',
  args: { label: '레이블', placeholder: '텍스트를 입력하세요', helperText: 'Help Text', error: true },
};

// ── Figma: States=Focused, Error=off / Error=on ───────
export const Focused: Story = {
  name: 'Focused (Error=off)',
  args: { label: '레이블', placeholder: '텍스트를 입력하세요', state: 'focused', helperText: 'Help Text' },
};

export const FocusedError: Story = {
  name: 'Focused (Error=on)',
  args: { label: '레이블', placeholder: '텍스트를 입력하세요', state: 'focused', helperText: 'Help Text', error: true },
};

// ── Figma: States=Typing, Error=off / Error=on ────────
export const Typing: Story = {
  name: 'Typing (Error=off)',
  args: { label: '레이블', value: '텍스트를 입력하세요', state: 'typing', helperText: 'Help Text' },
};

export const TypingError: Story = {
  name: 'Typing (Error=on)',
  args: { label: '레이블', value: '텍스트를 입력하세요', state: 'typing', helperText: 'Help Text', error: true },
};

// ── Figma: States=Typed, Error=off / Error=on ─────────
export const Typed: Story = {
  name: 'Typed (Error=off)',
  args: { label: '레이블', value: '텍스트를 입력하세요', state: 'typed', helperText: 'Help Text' },
};

export const TypedError: Story = {
  name: 'Typed (Error=on)',
  args: { label: '레이블', value: '텍스트를 입력하세요', state: 'typed', helperText: 'Help Text', error: true },
};

// ── Figma: States=Disabled, Error=off / Error=on ──────
export const Disabled: Story = {
  name: 'Disabled (Error=off)',
  args: { label: '레이블', placeholder: '텍스트를 입력하세요', state: 'disabled', helperText: 'Help Text' },
};

export const DisabledError: Story = {
  name: 'Disabled (Error=on)',
  args: { label: '레이블', placeholder: '텍스트를 입력하세요', state: 'disabled', helperText: 'Help Text', error: true },
};

// ── rightElement 슬롯: "모두 사용" 버튼 ──────────────
export const WithRightButton: Story = {
  name: 'With Right Button (모두 사용)',
  args: {
    label: '레이블',
    placeholder: '텍스트를 입력하세요',
    helperText: 'Help Text',
    rightElement: <InlineButton>모두 사용</InlineButton>,
  },
};

// ── 전체 상태 한눈에 보기 ─────────────────────────────
export const AllStates: Story = {
  name: 'All States',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 329 }}>
      <TextField label="Default" placeholder="텍스트를 입력하세요" helperText="Help Text" />
      <TextField label="Focused" placeholder="텍스트를 입력하세요" state="focused" helperText="Help Text" />
      <TextField label="Typing" value="텍스트를 입력하세요" state="typing" helperText="Help Text" />
      <TextField label="Typed" value="텍스트를 입력하세요" state="typed" helperText="Help Text" />
      <TextField label="Disabled" placeholder="텍스트를 입력하세요" state="disabled" helperText="Help Text" />
      <TextField label="Error" value="텍스트를 입력하세요" state="typed" error helperText="Help Text" />
    </div>
  ),
};
