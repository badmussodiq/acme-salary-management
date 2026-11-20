import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SessionUser } from '@acme/contracts';
import { serverData } from '@/lib/server-api';
import { LogoutButton } from './logout-button';

const PortalLayout = async ({ children }: { readonly children: ReactNode }) => {
  const user = await serverData<SessionUser>('/auth/me');

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="text-base font-semibold tracking-tight">
              ACME Salary Management
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/employees" className="text-sm text-slate-600 hover:text-slate-900">
              Employees
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
};

export default PortalLayout;
