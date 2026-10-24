import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { RouteErrorPage } from '@/ui/layouts/route-error-page.tsx';

function Crash(): never {
  throw new Error('The task list could not be rendered.');
}

function RouteErrorDemo() {
  const [router] = useState(() => {
    return createMemoryRouter([{ path: '/', Component: Crash, ErrorBoundary: RouteErrorPage }]);
  });
  return <RouterProvider router={router} />;
}

const meta = {
  title: 'Layouts/RouteErrorPage',
  component: RouteErrorDemo,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof RouteErrorDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RenderError: Story = {};
