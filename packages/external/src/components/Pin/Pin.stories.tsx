import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pin } from './Pin';

const meta = {
  title: 'Components/Pin',
  component: Pin,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    number: { control: { type: 'number', min: 1, max: 99 } },
    color:  { control: 'color' },
  },
} satisfies Meta<typeof Pin>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Figma: Pin (22×27) ───────────────────────────────────────────────────────
export const Default: Story = {
  args: { number: 1, color: '#3617ce' },
};

// ── 번호 순서 예시 ─────────────────────────────────────────────────────────────
export const Numbers: Story = {
  name: 'Number Variants',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => <Pin key={n} number={n} />)}
    </div>
  ),
};

// ── 리스트 컨텍스트 예시 ─────────────────────────────────────────────────────
export const InList: Story = {
  name: 'In List Context',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: 393 }}>
      {[
        { n: 1, name: 'T우주 패스 5G' },
        { n: 2, name: '5GX 플래티넘' },
        { n: 3, name: '5GX 레귤러' },
      ].map(({ n, name }) => (
        <div key={n} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', borderBottom: '1px solid rgba(6,12,31,0.06)',
        }}>
          <Pin number={n} />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#05001a', letterSpacing: '-0.04em' }}>
            {name}
          </span>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'fullscreen' },
};
