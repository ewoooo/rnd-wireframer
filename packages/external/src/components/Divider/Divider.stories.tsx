import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider';

const meta = {
  title: 'Components/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: { type: { control: 'select', options: ['contents', 'section'] } },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Contents: Story = { args: { type: 'contents' } };
export const Section:  Story = { args: { type: 'section' } };

export const BothTypes: Story = {
  render: () => (
    <div style={{ width: 393, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: '#060c1f' }}>콘텐츠 구분선 (1px)</p>
      <Divider type="contents" />
      <p style={{ fontSize: 13, color: '#060c1f' }}>섹션 구분선 (4px)</p>
      <Divider type="section" />
    </div>
  ),
};
