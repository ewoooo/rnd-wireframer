import type { Meta, StoryObj } from '@storybook/react-vite';
import { BadgeHome } from './BadgeHome';

const meta = {
  title: 'Components/BadgeHome',
  component: BadgeHome,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof BadgeHome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: 'Badge' } };

export const Variants: Story = {
  name: 'Label Variants',
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <BadgeHome label="Badge" />
      <BadgeHome label="NEW" />
      <BadgeHome label="인기" />
      <BadgeHome label="할인" />
      <BadgeHome label="추천" />
    </div>
  ),
};

export const InContext: Story = {
  name: 'In List Context',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: 393 }}>
      {[
        { title: 'T우주 패스 5G', badge: '인기' },
        { title: '5GX 플래티넘', badge: 'NEW' },
        { title: '데이터 온', badge: '추천' },
      ].map(({ title, badge }) => (
        <div key={title} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid rgba(6,12,31,0.06)',
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#05001a', letterSpacing: '-0.04em' }}>
            {title}
          </span>
          <BadgeHome label={badge} />
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'fullscreen' },
};
