import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppBar, BellIcon, CloseIcon, MenuIcon, SktLogo } from './AppBar';

const meta = {
  title: 'Components/AppBar',
  component: AppBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#060c1f', boxSizing: 'border-box' }}
    >
      {children}
    </button>
  );
}

// Figma: RightItem=On, Title=On, LeftItem=On, Logo=Off
export const BackTitleRight: Story = {
  name: 'Back + Title + Right',
  args: {
    title: '결제하기',
    showBack: true,
    rightItem: (
      <>
        <IconBtn label="알림"><BellIcon /></IconBtn>
        <IconBtn label="메뉴"><MenuIcon /></IconBtn>
      </>
    ),
  },
};

// Figma: RightItem=Off, Title=On, LeftItem=On, Logo=Off
export const BackTitle: Story = {
  name: 'Back + Title',
  args: { title: '결제하기', showBack: true },
};

// Figma: RightItem=Off, Title=Off, LeftItem=On, Logo=Off
export const BackOnly: Story = {
  name: 'Back Only',
  args: { showBack: true },
};

// Figma: RightItem=On, Title=Off, LeftItem=On, Logo=Off
export const BackRight: Story = {
  name: 'Back + Right',
  args: {
    showBack: true,
    rightItem: (
      <>
        <IconBtn label="알림"><BellIcon /></IconBtn>
        <IconBtn label="메뉴"><MenuIcon /></IconBtn>
      </>
    ),
  },
};

// Figma: RightItem=On, Title=Off, LeftItem=Off, Logo=Off
export const CloseOnly: Story = {
  name: 'Close Only',
  args: {
    rightItem: <IconBtn label="닫기"><CloseIcon /></IconBtn>,
  },
};

// Figma: RightItem=Off, Title=Off, LeftItem=On, Logo=On
export const LogoWithIcons: Story = {
  name: 'Logo + Right Icons',
  args: {
    showLogo: true,
    rightItem: (
      <>
        <IconBtn label="알림"><BellIcon /></IconBtn>
        <IconBtn label="메뉴"><MenuIcon /></IconBtn>
      </>
    ),
  },
};
