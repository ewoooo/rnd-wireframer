import type { Meta, StoryObj } from '@storybook/react-vite';
import { CardContentsItem } from './CardContentsItem';

const meta = {
  title: 'Components/CardContentsItem',
  component: CardContentsItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CardContentsItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeList: Story = {
  name: 'Type=List',
  args: {
    type: 'list',
    title: '왕과 사는 남자',
    subtitle: 'VVIP CGV 1인 무료 이용',
    daysLeft: 'D-2',
    buttonLabel: '버튼',
  },
};

export const TypeBarcode: Story = {
  name: 'Type=Barcode',
  args: {
    type: 'barcode',
    barcodeNumbers: ['1234', '4561', '1506', '4932'],
    barcodeTime: '19:58',
  },
};

export const TypeAi: Story = {
  name: 'Type=ai',
  args: {
    type: 'ai',
    aiText: 'T 멤버십 사용 가능 포인트 65,300P',
  },
};

export const AllTypes: Story = {
  name: 'All Types (In Card)',
  render: () => (
    <div
      style={{
        width: 353,
        padding: 20,
        background: '#ffffff',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <CardContentsItem
        type="list"
        title="왕과 사는 남자"
        subtitle="VVIP CGV 1인 무료 이용"
        daysLeft="D-2"
        buttonLabel="버튼"
      />
      <CardContentsItem type="barcode" />
      <CardContentsItem type="ai" aiText="T 멤버십 사용 가능 포인트 65,300P" />
    </div>
  ),
};

export const ListVariants: Story = {
  name: 'List — Content Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CardContentsItem
        type="list"
        title="왕과 사는 남자"
        subtitle="VVIP CGV 1인 무료 이용"
        daysLeft="D-2"
        buttonLabel="버튼"
      />
      <CardContentsItem
        type="list"
        title="T우주 X 넷플릭스"
        subtitle="스탠다드 구독 제공"
        daysLeft="D-7"
        buttonLabel="사용"
      />
      <CardContentsItem
        type="list"
        title="배달의민족 할인쿠폰"
        subtitle="배민 10% 할인"
        daysLeft="D-30"
        buttonLabel="받기"
      />
    </div>
  ),
};
