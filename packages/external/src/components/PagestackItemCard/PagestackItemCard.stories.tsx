import type { Meta, StoryObj } from '@storybook/react-vite';
import { PagestackItemCard } from './PagestackItemCard';

const meta = {
  title: 'Components/PagestackItemCard',
  component: PagestackItemCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof PagestackItemCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithContent: Story = {
  render: () => (
    <PagestackItemCard>
      <div style={{
        width: '100%',
        height: 28,
        background: '#f4f5fa',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        color: 'rgba(6,12,31,0.4)',
      }}>
        카드 슬롯
      </div>
    </PagestackItemCard>
  ),
};
