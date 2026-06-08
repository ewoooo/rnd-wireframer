import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonMore } from './ButtonMore';

const meta = {
  title: 'Components/ButtonMore',
  component: ButtonMore,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ButtonMore>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { label: '상품 정보 더보기' } };
export const CustomLabel: Story = { args: { label: '리뷰 더보기' } };
