import type { Meta, StoryObj } from '@storybook/react-vite';
import { Map } from './Map';

const meta = {
  title: 'Components/Map',
  component: Map,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Map>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SinglePin: Story = {
  args: { pins: [{ number: 1, left: 180, top: 76 }] },
};
