const SIZES = { sm: 'size-8 text-xs', lg: 'size-20 text-2xl' } as const;

export const initialsOf = (employee: { firstName: string; lastName: string }): string =>
  `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();

export const Avatar = ({
  employee,
  size = 'sm',
}: {
  readonly employee: { firstName: string; lastName: string; avatarUrl: string | null };
  readonly size?: keyof typeof SIZES;
}) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700 ${SIZES[size]}`}
    aria-hidden="true"
  >
    {employee.avatarUrl ? (
      // eslint-disable-next-line @next/next/no-img-element -- authenticated, same-origin image
      <img src={employee.avatarUrl} alt="" className="size-full object-cover" />
    ) : (
      initialsOf(employee)
    )}
  </span>
);
