'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ApiError } from '@/lib/api/errors';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Un 401/403/404 no se arregla reintentando; un corte de red, sí.
        retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
        refetchOnWindowFocus: true,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-center" richColors={false} closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
