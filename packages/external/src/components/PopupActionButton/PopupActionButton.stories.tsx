import type { Meta, StoryObj } from '@storybook/react-vite';
import { PopupActionButton } from './PopupActionButton';

const meta = {
  title: 'Components/PopupActionButton',
  component: PopupActionButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof PopupActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneButton: Story = {
  name: 'Options=1Button',
  args: { primaryLabel: '확인' },
};

export const TwoButtons: Story = {
  name: 'Options=2Buttons',
  args: { primaryLabel: '확인', secondaryLabel: '취소' },
};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: '#f4f5fa', padding: 16, borderRadius: 16 }}>
      <PopupActionButton primaryLabel="확인" />
      <PopupActionButton primaryLabel="요금제 보기" secondaryLabel="취소" />
    </div>
  ),
};
