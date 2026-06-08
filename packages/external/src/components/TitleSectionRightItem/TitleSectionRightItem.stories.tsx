import type { Meta, StoryObj } from '@storybook/react-vite';
import { TitleSectionRightItem } from './TitleSectionRightItem';

const meta = {
  title: 'Components/TitleSectionRightItem',
  component: TitleSectionRightItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    type: { control: 'select', options: ['icon', 'textButton', 'textItemButton', 'buttonListOrder', 'text'] },
  },
} satisfies Meta<typeof TitleSectionRightItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IconType: Story = {
  name: 'Icon',
  args: { type: 'icon' },
};

export const TextButtonType: Story = {
  name: 'TextButton',
  args: { type: 'textButton', label: 'Text' },
};

export const TextItemButtonType: Story = {
  name: 'TextItemButton',
  args: { type: 'textItemButton', subText: '선택한 휴대폰 번호', highlight: '3개' },
};

export const ButtonListOrderType: Story = {
  name: 'ButtonListOrder',
  args: { type: 'buttonListOrder', label: '인기순' },
};

export const TextType: Story = {
  name: 'Text',
  args: { type: 'text', label: '텍스트' },
};

export const AllTypes: Story = {
  name: 'All Types',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      <TitleSectionRightItem type="icon" />
      <TitleSectionRightItem type="textButton" label="Text" />
      <TitleSectionRightItem type="textItemButton" subText="선택한 휴대폰 번호" highlight="3개" />
      <TitleSectionRightItem type="buttonListOrder" label="인기순" />
      <TitleSectionRightItem type="text" label="텍스트" />
    </div>
  ),
};
