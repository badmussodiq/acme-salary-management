import { ForgotPasswordForm } from './forgot-password-form';

const ForgotPasswordPage = () => (
  <main className="flex min-h-screen items-center justify-center px-4">
    <div className="w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Forgot your password?</h1>
      <p className="mb-6 text-sm text-slate-500">
        Enter your email and we will send you a link to choose a new one.
      </p>
      <ForgotPasswordForm />
    </div>
  </main>
);

export default ForgotPasswordPage;
