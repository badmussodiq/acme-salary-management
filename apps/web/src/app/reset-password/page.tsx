import { ResetPasswordForm } from './reset-password-form';

interface Props {
  readonly searchParams: Promise<{ readonly token?: string }>;
}

const ResetPasswordPage = async ({ searchParams }: Props) => {
  const { token } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="mb-6 text-sm text-slate-500">Use at least 12 characters.</p>
        <ResetPasswordForm token={token ?? ''} />
      </div>
    </main>
  );
};

export default ResetPasswordPage;
