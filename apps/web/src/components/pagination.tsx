import Link from 'next/link';
import { pageWindow, type PageInfo } from '@/lib/pagination';
import { buttonClass } from './ui';

export const Pagination = ({
  meta,
  hrefFor,
  label,
}: {
  readonly meta: PageInfo;
  readonly hrefFor: (page: number) => string;
  readonly label: string;
}) => {
  if (meta.total === 0) return null;
  const window = pageWindow(meta);

  return (
    <nav
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"
      aria-label={`${label} pagination`}
    >
      <span>
        Showing {window.from.toLocaleString('en')}–{window.to.toLocaleString('en')} of{' '}
        {meta.total.toLocaleString('en')}
      </span>
      <div className="flex items-center gap-2">
        {meta.page > 1 ? (
          <Link className={buttonClass('secondary')} href={hrefFor(meta.page - 1)}>
            Previous
          </Link>
        ) : null}
        <span>
          Page {meta.page} of {window.pages}
        </span>
        {meta.page < window.pages ? (
          <Link className={buttonClass('secondary')} href={hrefFor(meta.page + 1)}>
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
};
