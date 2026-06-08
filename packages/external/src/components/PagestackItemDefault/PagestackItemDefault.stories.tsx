import type { Meta, StoryObj } from '@storybook/react-vite';
import { PagestackItemDefault } from './PagestackItemDefault';

const meta = {
  title: 'Components/PagestackItemDefault',
  component: PagestackItemDefault,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof PagestackItemDefault>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithContent: Story = {
  render: () => (
    <PagestackItemDefault>
      <div style={{
        width: '100%',
        height: 41,
        background: '#f4f5fa',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        color: 'rgba(6,12,31,0.4)',
      }}>
        콘텐츠 슬롯
      </div>
    </PagestackItemDefault>
  ),
};
