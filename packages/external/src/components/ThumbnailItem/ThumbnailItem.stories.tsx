import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThumbnailItem } from './ThumbnailItem';

const meta = {
  title: 'Components/ThumbnailItem',
  component: ThumbnailItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ThumbnailItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Size40: Story = {
  name: 'Size 40',
  args: { size: '40' },
};

export const SizeMovie: Story = {
  name: 'Size Movie (56×40)',
  args: { size: 'movie' },
};

export const Size64: Story = {
  name: 'Size 64',
  args: { size: '64' },
};

export const Size160: Story = {
  name: 'Size 160',
  args: { size: '160' },
};

export const Size182: Story = {
  name: 'Size 182',
  args: { size: '182' },
};

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
        <ThumbnailItem size="40" />
        <ThumbnailItem size="movie" />
        <ThumbnailItem size="64" />
      </div>
      <ThumbnailItem size="160" />
      <ThumbnailItem size="182" />
    </div>
  ),
};
