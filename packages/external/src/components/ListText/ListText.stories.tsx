import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListText } from './ListText';

const meta = {
  title: 'Components/ListText',
  component: ListText,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    table: {
      control: 'select',
      options: ['off', 'on', 'dot', 'firstTitle', 'secondTitle'],
    },
    showRightItem: { control: 'boolean' },
  },
} satisfies Meta<typeof ListText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  name: 'Table=off (Title + Chevron)',
  args: { table: 'off', title: '타이틀 레이블' },
};

export const On: Story = {
  name: 'Table=on (Title + SubText)',
  args: { table: 'on', title: '타이틀 레이블', subText: '본문' },
};

export const Dot: Story = {
  name: 'Table=dot (Bullet + Chevron)',
  args: { table: 'dot', subText: '본문' },
};

export const FirstTitle: Story = {
  name: 'Table=firstTitle (Bold Title + Price)',
  args: { table: 'firstTitle', title: '타이틀 레이블', price: '999,999원' },
};

export const SecondTitle: Story = {
  name: 'Table=secondTitle (Medium Title + Chevron)',
  args: { table: 'secondTitle', title: '타이틀 레이블' },
};

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => (
    <div style={{ width: 393, padding: '0 20px', display: 'flex', flexDirection: 'column' }}>
      <ListText table="off" title="타이틀 레이블" />
      <ListText table="on" title="타이틀 레이블" subText="본문" />
      <ListText table="firstTitle" title="타이틀 레이블" price="999,999원" />
      <ListText table="secondTitle" title="타이틀 레이블" />
      <ListText table="dot" subText="본문" />
    </div>
  ),
};
