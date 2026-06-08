import type { Meta, StoryObj } from '@storybook/react-vite';
import { TitleBottomSheet } from './TitleBottomSheet';

const meta = {
  title: 'Components/TitleBottomSheet',
  component: TitleBottomSheet,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TitleBottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  name: 'Title Only',
  args: { title: '정렬' },
};

export const WithSubText: Story = {
  name: 'With SubText',
  args: {
    title: '정렬',
    subText: '총',
    subTextHighlight: '24개',
  },
};

export const InCard: Story = {
  name: 'In Sheet Context',
  render: () => (
    <div style={{ width: 393, padding: 20, background: '#ffffff', borderRadius: 20 }}>
      <TitleBottomSheet title="요금제 선택" subText="월" subTextHighlight="55,000원부터" />
    </div>
  ),
};
