import type { Meta, StoryObj } from '@storybook/react-vite';
import { InfoTextList } from './InfoTextList';

const meta = {
  title: 'Components/InfoTextList',
  component: InfoTextList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    badge: { control: 'text' },
    rightText: { control: 'text' },
  },
} satisfies Meta<typeof InfoTextList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBadge: Story = {
  name: 'With Badge (NEW)',
  args: {
    title: '일이삼사오육칠팔구십일이삼사오육칠팔구십',
    category: '{텍스트}',
    date: '2026.01.30',
    badge: 'NEW',
  },
};

export const WithRightText: Story = {
  name: 'With Right Text (+500P)',
  args: {
    title: '일이삼사오육칠팔구십일이삼사오육칠팔구십',
    category: '{텍스트}',
    date: '2026.01.30',
    rightText: '+500P',
  },
};

export const NoDecoration: Story = {
  name: 'No Badge / Right Text',
  args: {
    title: '일이삼사오육칠팔구십일이삼사오육칠팔구십',
    category: '{텍스트}',
    date: '2026.01.30',
  },
};

export const BothVariants: Story = {
  name: 'Both Variants',
  render: () => (
    <div style={{ width: 369, padding: '0 20px', background: '#f4f5fa', borderRadius: 12 }}>
      <InfoTextList
        title="일이삼사오육칠팔구십일이삼사오육칠팔구십"
        category="{텍스트}"
        date="2026.01.30"
        badge="NEW"
      />
      <div style={{ height: 1, background: 'rgba(6,12,31,0.08)' }} />
      <InfoTextList
        title="일이삼사오육칠팔구십일이삼사오육칠팔구십"
        category="{텍스트}"
        date="2026.01.30"
        rightText="+500P"
      />
    </div>
  ),
};
