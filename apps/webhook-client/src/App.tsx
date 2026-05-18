import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { MainLayout } from './layout/MainLayout';
import { AddWebhookPage } from './pages/AddWebhookPage';
import { ErrorPage } from './pages/ErrorPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'add-webhook', element: <AddWebhookPage /> },
      { path: 'Error', element: <ErrorPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={appRouter} />;
}

export { appRouter };
