// Every weight and italic the design uses, so the browser never has to fake a bold or a slant.
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-600-italic.css';
import '@fontsource/cormorant-garamond/latin-700.css';
import '@fontsource/cormorant-garamond/latin-700-italic.css';
import '@fontsource-variable/manrope';
import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './router';
import { SplashGate } from './components/SplashGate';
import { UIProvider } from './lib/ui';

// The server renders SEO tags for crawlers; once the app is running, React manages them.
document.querySelectorAll('[data-ssr-head]').forEach((n) => n.remove());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <UIProvider>
            <SplashGate />
            <RouterProvider router={router} />
            <Toaster
              position="bottom-center"
              toastOptions={{
                className: '!rounded-xs !border-line !bg-ink !text-ivory !font-sans !text-sm',
              }}
            />
          </UIProvider>
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  </StrictMode>,
);
