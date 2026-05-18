import type { Story } from '@ladle/react';

import { Alert, AlertDescription, AlertTitle } from './alert';

export const Default: Story = () => (
  <Alert>
    <AlertTitle>Heads up</AlertTitle>
    <AlertDescription>Basket sync uses mobile-bff when you are signed in.</AlertDescription>
  </Alert>
);

export const Destructive: Story = () => (
  <Alert variant="destructive">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>Could not reach the basket API.</AlertDescription>
  </Alert>
);
