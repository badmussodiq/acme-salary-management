import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';

const join = (...parts: readonly (string | false | undefined)[]): string =>
  parts.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'danger';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60';

const BUTTON_VARIANTS: Readonly<Record<Variant, string>> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export const buttonClass = (variant: Variant = 'primary'): string =>
  join(BUTTON_BASE, BUTTON_VARIANTS[variant]);

export const Button = ({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { readonly variant?: Variant }) => (
  <button className={join(buttonClass(variant), className)} {...props} />
);

export const LinkButton = ({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<typeof Link> & { readonly variant?: Variant }) => (
  <Link className={join(buttonClass(variant), className)} {...props} />
);

export const Card = ({
  title,
  action,
  children,
  className,
}: {
  readonly title?: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}) => (
  <section className={join('rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
    {title ? (
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </header>
    ) : null}
    <div className="p-5">{children}</div>
  </section>
);

type Tone = 'green' | 'slate';

const BADGE_TONES: Readonly<Record<Tone, string>> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export const Badge = ({
  tone,
  children,
}: {
  readonly tone: Tone;
  readonly children: ReactNode;
}) => (
  <span
    className={join(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
      BADGE_TONES[tone],
    )}
  >
    {children}
  </span>
);

export const PageHeader = ({
  title,
  subtitle,
  actions,
}: {
  readonly title: string;
  readonly subtitle?: string;
  readonly actions?: ReactNode;
}) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
    {actions ? <div className="flex gap-2">{actions}</div> : null}
  </div>
);

export const TABLE_CLASS = [
  'w-full text-left text-sm',
  '[&_th]:whitespace-nowrap [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-500',
  '[&_td]:whitespace-nowrap [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-slate-700',
  '[&_tbody_tr]:border-t [&_tbody_tr]:border-slate-100',
].join(' ');
