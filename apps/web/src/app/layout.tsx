import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'ACME Salary Management',
  description: 'Salary management for the ACME HR team',
};

const RootLayout = ({ children }: { readonly children: ReactNode }) => (
  <html lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
