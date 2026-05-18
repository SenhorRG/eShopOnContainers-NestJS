import type { Story } from '@ladle/react';

import { Button } from './button';

export const Primary: Story = () => <Button>Primary</Button>;

export const Outline: Story = () => (
  <Button type="button" variant="outline">
    Outline
  </Button>
);
