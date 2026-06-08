import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListSelected } from './ListSelected';

const meta = {
  title: 'Components/ListSelected',
  component: ListSelected,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    type: { control: 'select', options: ['radio', 'checkbox'] },
    checked: { control: 'boolean' },
    showPrice: { control: 'boolean' },
    showButton: { control: 'boolean' },
  },
} satisfies Meta<typeof ListSelected>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RadioDefault: Story = {
  name: 'Radio — Default',
  args: { type: 'radio', label: '텍스트', price: '-9,900원', checked: false },
};

export const RadioChecked: Story = {
  name: 'Radio — Checked',
  args: { type: 'radio', label: '텍스트', price: '-9,900원', checked: true },
};

export const CheckboxDefault: Story = {
  name: 'Checkbox — Default',
  args: { type: 'checkbox', label: '텍스트', price: '-9,900원', checked: false },
};

export const CheckboxChecked: Story = {
  name: 'Checkbox — Checked',
  args: { type: 'checkbox', label: '텍스트', price: '-9,900원', checked: true },
};

export const BothTypes: Story = {
  name: 'Both Types',
  render: () => {
    const [radioChecked, setRadioChecked] = useState(false);
    const [checkboxChecked, setCheckboxChecked] = useState(true);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: 393, padding: '0 20px' }}>
        <ListSelected
          type="radio"
          label="텍스트"
          price="-9,900원"
          checked={radioChecked}
          onChange={setRadioChecked}
        />
        <ListSelected
          type="checkbox"
          label="텍스트"
          price="-9,900원"
          checked={checkboxChecked}
          onChange={setCheckboxChecked}
        />
      </div>
    );
  },
};
