import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, ICON_PATHS, type SystemIconName, type IconSize } from './Icon';

const meta = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    name: {
      control: 'select',
      options: Object.keys(ICON_PATHS) as SystemIconName[],
    },
    size: {
      control: 'select',
      options: [12, 16, 20, 24, 32, 40] as IconSize[],
    },
    color: { control: 'color' },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── 단일 아이콘 ─────────────────────────────────────────
export const Default: Story = {
  args: { name: 'search', size: 24 },
};

// ── 크기 비교 (Figma node 10338:16752 — Size=40/32/24/20/16/12) ──
export const Sizes: Story = {
  name: 'Sizes (40 / 32 / 24 / 20 / 16 / 12)',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 16 }}>
      {([40, 32, 24, 20, 16, 12] as IconSize[]).map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Icon name="shopping" size={size} />
          <span style={{ fontSize: 11, color: 'rgba(6,12,31,0.5)', fontFamily: 'monospace' }}>{size}px</span>
        </div>
      ))}
    </div>
  ),
};

// ── 전체 아이콘 갤러리 ─────────────────────────────────
const ICON_GROUPS: { label: string; icons: SystemIconName[] }[] = [
  {
    label: 'Navigation',
    icons: ['back', 'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'dropdown'],
  },
  {
    label: 'Actions',
    icons: ['search', 'ai-search', 'plus', 'download', 'close', 'barcord'],
  },
  {
    label: 'Commerce',
    icons: ['shopping', 'shopping-filled', 'heart', 'heart-filled'],
  },
  {
    label: 'Communication',
    icons: ['bubble', 'bubble-filled', 'voice'],
  },
  {
    label: 'System',
    icons: ['menu', 'my', 'my-filled', 'info', 'time'],
  },
];

export const AllIcons: Story = {
  name: 'All Icons',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 16 }}>
      {ICON_GROUPS.map(({ label, icons }) => (
        <div key={label}>
          <p style={{
            margin: '0 0 12px',
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(6,12,31,0.4)',
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
          }}>
            {label}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {icons.map((name) => (
              <div
                key={name}
                title={name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 8px',
                  borderRadius: 12,
                  background: 'rgba(6,12,31,0.03)',
                  minWidth: 72,
                  cursor: 'default',
                }}
              >
                <Icon name={name} size={24} />
                <span style={{
                  fontSize: 10,
                  color: 'rgba(6,12,31,0.5)',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxWidth: 64,
                }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

// ── 색상 적용 예시 ─────────────────────────────────────
export const Colors: Story = {
  name: 'Color Examples',
  render: () => {
    const examples = [
      { color: 'rgba(6,12,31,1)', label: 'Default (near-black)' },
      { color: '#3617ce', label: 'Primary (SKT blue)' },
      { color: 'rgba(6,12,31,0.4)', label: 'Inactive (40% gray)' },
      { color: '#e42939', label: 'Error (red)' },
      { color: '#ffffff', label: 'White', bg: '#3617ce' },
    ];
    return (
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: 16 }}>
        {examples.map(({ color, label, bg }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: bg || 'rgba(6,12,31,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon name="shopping" size={24} color={color} />
            </div>
            <span style={{ fontSize: 11, color: 'rgba(6,12,31,0.5)', textAlign: 'center', maxWidth: 72 }}>{label}</span>
          </div>
        ))}
      </div>
    );
  },
};

// ── AppBar 사용 컨텍스트 예시 ───────────────────────────
export const InContext: Story = {
  name: 'In AppBar Context',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* AppBar 예시 */}
      {[
        { left: 'back', title: '결제하기', right: [] },
        { left: 'back', title: '검색', right: ['search'] },
        { left: 'back', title: '상품 상세', right: ['heart', 'shopping'] },
        { left: null, title: 'SKT', right: ['barcord', 'shopping', 'menu'] },
      ].map(({ left, title, right }, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 20px',
          background: '#fff',
          borderBottom: '1px solid #ebeef6',
          gap: 4,
          height: 48,
          boxSizing: 'border-box',
        }}>
          {left && (
            <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={left as SystemIconName} size={24} />
            </div>
          )}
          <span style={{
            flex: 1,
            fontSize: 17,
            fontWeight: 600,
            color: 'rgba(6,12,31,1)',
            letterSpacing: '-0.05em',
          }}>
            {title}
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            {right.map((name) => (
              <div key={name} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={name as SystemIconName} size={24} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
