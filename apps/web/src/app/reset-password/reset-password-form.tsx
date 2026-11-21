'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AcceptedResponse, ResetPasswordRequest } from '@acme/contracts';
import { useApiAction, useFormFields } from '@acme/web-utils';
import { TextField } from '@/components/form-fields';
import { Button, Card } from '@/components/ui';

export const ResetPasswordForm = ({ token }: { readonly token: string }) => {
  const router = useRouter();
  const { values, bind } = useFormFields<{ password: string }>({ password: '' });
  const { run, pending, fieldErrors } = useApiAction<AcceptedResponse, ResetPasswordRequest>(
    '/api/v1/auth/reset-password',
    {
      successMessage: 'Password updated. Sign in with your new password.',
      onSuccess: () => router.replace('/login'),
    },
  );

  if (!token) {
    return (
      <Card>
        <p role="alert" className="text-sm text-red-600">
          This reset link is incomplete.
        </p>
        <Link href="/forgot-password" className="mt-4 block text-sm text-brand-600 hover:underline">
          Request a new link
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void run({ token, password: values.password });
        }}
      >
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          binding={bind('password')}
          error={fieldErrors['password']}
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </Card>
  );
};
