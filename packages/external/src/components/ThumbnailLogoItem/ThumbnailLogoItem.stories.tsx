import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThumbnailLogoItem } from './ThumbnailLogoItem';

const meta = {
  title: 'Components/ThumbnailLogoItem',
  component: ThumbnailLogoItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ThumbnailLogoItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { bgColor: '#FF143B' },
};

export const CustomColor: Story = {
  name: 'Custom Background',
  args: { bgColor: '#3617CE' },
};

export const Variants: Story = {
  name: 'Color Variants',
  render: () => (
    <div style={{ display: 'flex', gap: 8, padding: 16 }}>
      <ThumbnailLogoItem bgColor="#FF143B" />
      <ThumbnailLogoItem bgColor="#3617CE" />
      <ThumbnailLogoItem bgColor="#E2E6F1" />
      <ThumbnailLogoItem bgColor="#F4F5FA" />
    </div>
  ),
};
