import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { BottomNavigation } from './BottomNavigation';

const meta = {
  title: 'Components/BottomNavigation',
  component: BottomNavigation,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.1587 3.62502C11.242 2.79166 12.759 2.79166 13.8423 3.62502L19.8423 8.23993C20.573 8.80204 21.0004 9.66659 21.0005 10.5822V18.0329C21.0003 19.6714 19.6572 21 18.0005 21H13.0005V15C13.0005 14.4538 12.5733 14 12.021 14C11.4687 14 11.0005 14.4538 11.0005 15V21H6.00049C4.34373 21 3.00064 19.6714 3.00049 18.0329V10.5822C3.00054 9.66659 3.42798 8.80204 4.15869 8.23993L10.1587 3.62502Z" fill="currentColor" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.23706 4.8743C6.92914 3.34403 9.15722 2.73605 11.2761 3.04813L10.9763 3.6702L10.9753 3.67118C10.7931 4.04902 10.504 4.36341 10.1453 4.57547L9.98706 4.65946L9.15405 5.06083C9.14459 5.06539 9.1351 5.06984 9.12573 5.0745C8.11766 5.27702 7.15626 5.76982 6.37476 6.55204C4.26607 8.66306 4.26607 12.0855 6.37476 14.1966C8.48376 16.3075 11.9035 16.3076 14.0125 14.1966C14.5762 13.6322 14.9875 12.9735 15.2498 12.2718C15.4298 12.089 15.5872 11.8722 15.7097 11.6184L16.1111 10.7854L16.1121 10.7845C16.3203 10.3528 16.6686 10.0044 17.1003 9.79618L17.1013 9.7952L17.5496 9.5784C17.7321 11.2814 17.3263 13.0357 16.3318 14.511L20.3826 18.5667C20.9308 19.1159 20.9309 20.0058 20.3826 20.555C19.8339 21.1042 18.944 21.1042 18.3953 20.555L14.3484 16.5042C11.5707 18.3952 7.79254 18.1854 5.23706 15.8743L4.96167 15.6116C2.07202 12.7191 2.07202 8.02952 4.96167 5.137L5.23706 4.8743Z" fill="currentColor" />
      <path d="M12.7278 3.48835C13.0569 2.80596 14.0283 2.80598 14.3574 3.48835L14.7595 4.32113C15.1152 5.05885 15.7104 5.6541 16.4481 6.00974L17.2809 6.41092C17.9634 6.73996 17.9633 7.71227 17.2809 8.04143L16.4481 8.44353C15.7104 8.79919 15.1151 9.39441 14.7595 10.1321L14.3574 10.9649C14.0282 11.647 13.057 11.647 12.7278 10.9649L12.3257 10.1321C11.9701 9.39439 11.3748 8.79919 10.6371 8.44353L9.80431 8.04143C9.12196 7.71224 9.12178 6.73995 9.80431 6.41092L10.6371 6.00974C11.3748 5.65411 11.97 5.05884 12.3257 4.32113L12.7278 3.48835Z" fill="currentColor" />
    </svg>
  );
}

function ShoppingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.9994 3C14.2085 3 15.9994 4.79086 15.9994 7H17.4134C18.9853 7 20.2908 8.2136 20.4056 9.78125L20.9915 17.7812C21.1186 19.5196 19.7424 21 17.9994 21H6.00131C4.25826 21 2.88201 19.5196 3.00913 17.7812L3.59506 9.78125C3.70985 8.21374 5.01462 7.00022 6.58627 7H7.99936C7.99936 4.79097 9.79037 3.00018 11.9994 3ZM11.9994 5C10.8949 5.00018 9.99936 5.89554 9.99936 7H13.9994C13.9994 5.89543 13.1039 5 11.9994 5Z" fill="currentColor" />
    </svg>
  );
}

const ITEMS = [
  { key: 'home', label: 'My', icon: <HomeIcon /> },
  { key: 'search', label: '검색', icon: <SearchIcon /> },
  { key: 'shopping', label: '쇼핑', icon: <ShoppingIcon /> },
];

export const Default: Story = {
  args: { items: ITEMS, activeKey: 'home', onChange: () => {} },
};

export const Interactive: Story = {
  render: () => {
    const [active, setActive] = useState('home');
    return (
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <BottomNavigation items={ITEMS} activeKey={active} onChange={setActive} />
      </div>
    );
  },
};
