import type { Meta, StoryObj } from '@storybook/react-vite';
import { OptionListItem } from './OptionListItem';

const meta = {
  title: 'Components/OptionListItem',
  component: OptionListItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof OptionListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ModuleSelected: Story = {
  args: { type: 'Module', label: '코발트 바이올렛', selected: true },
};

export const ModuleDefault: Story = {
  args: { type: 'Module', label: '코발트 바이올렛', selected: false },
};

export const ModuleWithSubText: Story = {
  args: { type: 'Module', label: '코발트 바이올렛', subText: '평일 기준\n18시 주문까지 가능', selected: true },
};

export const ListSelected: Story = {
  args: { type: 'List', value: '256', unit: 'GB', badge: 'AI 추천', price: '1,254,000원', selected: true },
};

export const ListDefault: Story = {
  args: { type: 'List', value: '256', unit: 'GB', badge: 'AI 추천', price: '1,254,000원', selected: false },
};
