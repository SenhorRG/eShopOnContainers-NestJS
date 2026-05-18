import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';

import { CartProvider } from '../features/cart/cart-context';
import { CatalogPage } from '../features/catalog/catalog-page';
import { CartPage } from '../features/cart/cart-page';
import { CheckoutPage } from '../features/checkout/checkout-page';
import { ItemPage } from '../features/item/item-page';
import { OrdersPage } from '../features/orders/orders-page';
import { LoginPage } from '../features/auth/login-page';
import { LogoutPage } from '../features/auth/logout-page';
import { OidcLoginPage } from '../features/auth/oidc-login-page';
import { RegisterPage } from '../features/auth/register-page';
import { OidcCallbackPage } from '../features/auth/oidc-callback-page';
import { MainLayout } from '../layout/main-layout';
import { StorefrontUiProvider } from '../layout/storefront-ui-context';

function RootShell() {
  return (
    <StorefrontUiProvider>
      <CartProvider>
        <MainLayout />
      </CartProvider>
    </StorefrontUiProvider>
  );
}

const rawBase = (import.meta.env.VITE_ESHOP_STOREFRONT_BASE as string | undefined)?.trim();
const basename =
  rawBase && rawBase !== '/' ? rawBase.replace(/\/$/, '') : undefined;

const appRouter = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootShell />,
      children: [
        { index: true, element: <CatalogPage /> },
        { path: 'item/:itemId', element: <ItemPage /> },
        { path: 'cart', element: <CartPage /> },
        { path: 'checkout', element: <CheckoutPage /> },
        { path: 'user/login', element: <LoginPage /> },
        { path: 'user/login/oidc', element: <OidcLoginPage /> },
        { path: 'user/register', element: <RegisterPage /> },
        { path: 'user/logout', element: <LogoutPage /> },
        { path: 'user/orders', element: <OrdersPage /> },
        { path: 'auth/callback', element: <OidcCallbackPage /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename },
);

export function AppRouter() {
  return <RouterProvider router={appRouter} />;
}

export { appRouter };
