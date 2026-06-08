import type { Meta, StoryObj } from '@storybook/react-vite';
import { TitleSection } from './TitleSection';

const meta = {
  title: 'Components/TitleSection',
  component: TitleSection,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TitleSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoSubtitle: Story = {
  args: { showSubtitle: false },
};

export const NoCount: Story = {
  args: { showCount: false },
};

export const NoChevron: Story = {
  args: { showChevron: false },
};
