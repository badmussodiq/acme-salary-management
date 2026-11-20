import { LoginForm } from './login-form';

const LoginPage = () => (
  <main className="flex min-h-screen items-center justify-center px-4">
    <div className="w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">ACME Salary Management</h1>
      <p className="mb-6 text-sm text-slate-500">Sign in to manage compensation records.</p>
      <LoginForm />
    </div>
  </main>
);

export default LoginPage;
