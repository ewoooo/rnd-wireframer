import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagestack } from './Pagestack';

const meta = {
  title: 'Components/Pagestack',
  component: Pagestack,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Pagestack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: '타이틀', showTitle: true },
};

export const WithoutTitle: Story = {
  args: { showTitle: false },
};

export const WithContent: Story = {
  args: { title: '추천 상품' },
  render: (args) => (
    <Pagestack {...args}>
      <div style={{
        width: '100%',
        height: 69,
        background: '#f4f5fa',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        color: 'rgba(6,12,31,0.4)',
      }}>
        콘텐츠 슬롯
      </div>
    </Pagestack>
  ),
};
