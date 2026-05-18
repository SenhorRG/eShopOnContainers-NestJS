import type { Story } from '@ladle/react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

export const Basic: Story = () => (
  <Card className="w-full max-w-sm">
    <CardHeader>
      <CardTitle>@eshop/ui</CardTitle>
      <CardDescription>Shared primitives for storefront + webhook client.</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Ladle story — tokens match apps consuming this package.</p>
    </CardContent>
  </Card>
);
