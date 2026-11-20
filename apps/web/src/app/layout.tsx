import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ACME Salary Management',
  description: 'Salary management for the ACME HR team',
};

const RootLayout = ({ children }: { readonly children: ReactNode }) => (
  <html lang="en">
    <body>
      {children}
      <Toaster richColors position="top-right" />
    </body>
  </html>
);

export default RootLayout;
