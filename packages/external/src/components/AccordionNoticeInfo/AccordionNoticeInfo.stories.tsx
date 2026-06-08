import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccordionNoticeInfo } from './AccordionNoticeInfo';

const meta = {
  title: 'Components/AccordionNoticeInfo',
  component: AccordionNoticeInfo,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    state: { control: 'radio', options: ['Close', 'Open'] },
  },
} satisfies Meta<typeof AccordionNoticeInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Close: Story = {
  args: { state: 'Close', title: 'Title Text', showQLabel: true },
};

export const Open: Story = {
  args: { state: 'Open', title: 'Title Text', showQLabel: true },
};

export const OpenWithCustomContent: Story = {
  args: { state: 'Open', title: '자주 묻는 질문 제목입니다', showQLabel: true },
  render: (args) => (
    <AccordionNoticeInfo {...args}>
      <div style={{ padding: '4px 0', fontSize: 14, fontWeight: 400, lineHeight: 1.3, color: '#05001a', letterSpacing: '-0.56px' }}>
        <ul style={{ paddingLeft: 21 }}>
          <li style={{ listStyle: 'disc' }}>첫 번째 안내 사항입니다.</li>
          <li style={{ listStyle: 'disc' }}>두 번째 안내 사항입니다.</li>
          <li style={{ listStyle: 'disc' }}>세 번째 안내 사항입니다.</li>
        </ul>
      </div>
    </AccordionNoticeInfo>
  ),
};

export const WithoutQLabel: Story = {
  args: { state: 'Open', title: '공지 내용 제목', showQLabel: false },
};
