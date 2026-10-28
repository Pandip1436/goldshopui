import type { ComponentType } from 'react';
import { createBrowserRouter, isRouteErrorResponse, useRouteError, type RouteObject } from 'react-router';
import { Layout } from './components/layout/Layout';
import { ButtonLink } from './components/ui/Button';
import { EmptyState } from './components/ui/misc';
import Home from './pages/Home';

/** Route-level code splitting: each page's code loads before navigation completes. */
const page = (load: () => Promise<{ default: ComponentType }>): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await load()).default }),
});

function RouteError() {
  const err = useRouteError();
  const notFound = isRouteErrorResponse(err) && err.status === 404;
  // A failed chunk load usually means a new version was deployed; a reload fixes it.
  const stale = err instanceof Error && /dynamically imported module|Importing a module script failed/i.test(err.message);
  return (
    <div className="container-page py-20">
      <EmptyState
        title={notFound ? 'Page not found' : stale ? 'A new version is available' : 'Something went wrong'}
        action={
          stale ? (
            <button className="underline" onClick={() => window.location.reload()}>
              Reload the page
            </button>
          ) : (
            <ButtonLink to="/">Back to home</ButtonLink>
          )
        }
      >
        {notFound ? 'The page you were looking for has moved or no longer exists.' : 'Please try again in a moment.'}
      </EmptyState>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: 'shop', ...page(() => import('./pages/Shop')) },
      { path: 'shop/:category', ...page(() => import('./pages/Shop')) },
      { path: 'collections', ...page(() => import('./pages/Collections')) },
      { path: 'collections/:collection', ...page(() => import('./pages/Shop')) },
      { path: 'product/:slug', ...page(() => import('./pages/Product')) },
      { path: 'cart', ...page(() => import('./pages/Cart')) },
      { path: 'checkout', ...page(() => import('./pages/Checkout')) },
      { path: 'orders/:orderNumber', ...page(() => import('./pages/Order')) },
      { path: 'track-order', ...page(() => import('./pages/TrackOrder')) },
      { path: 'wishlist', ...page(() => import('./pages/Wishlist')) },
      { path: 'login', ...page(() => import('./pages/auth/Login')) },
      { path: 'register', ...page(() => import('./pages/auth/Register')) },
      { path: 'forgot-password', ...page(() => import('./pages/auth/ForgotPassword')) },
      { path: 'reset-password', ...page(() => import('./pages/auth/ResetPassword')) },
      { path: 'account', ...page(() => import('./pages/Account')) },
      { path: 'about', ...page(() => import('./pages/About')) },
      { path: 'contact', ...page(() => import('./pages/Contact')) },
      { path: 'faq', ...page(() => import('./pages/Faq')) },
      { path: 'journal', ...page(() => import('./pages/Journal')) },
      { path: 'journal/:slug', ...page(() => import('./pages/Post')) },
      { path: 'policies/:slug', ...page(() => import('./pages/Policy')) },
      { path: 'gold-savings-plan', ...page(() => import('./pages/SavingsPlan')) },
      { path: 'gold-rate', ...page(() => import('./pages/GoldRate')) },
      { path: '*', ...page(() => import('./pages/NotFound')) },
    ],
  },
  { path: 'orders/:orderNumber/invoice', errorElement: <RouteError />, ...page(() => import('./pages/Invoice')) },
  { path: 'admin/*', errorElement: <RouteError />, ...page(() => import('./admin/AdminApp')) },
]);
