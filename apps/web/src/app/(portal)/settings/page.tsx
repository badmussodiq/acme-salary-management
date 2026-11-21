import { ChangePasswordForm } from './change-password-form';

const SettingsPage = () => (
  <div className="max-w-sm">
    <h1 className="mb-1 text-2xl font-semibold tracking-tight">Settings</h1>
    <p className="mb-6 text-sm text-slate-500">
      Change your password. Your other sessions are signed out.
    </p>
    <ChangePasswordForm />
  </div>
);

export default SettingsPage;
