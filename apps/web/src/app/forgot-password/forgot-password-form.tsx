'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { AcceptedResponse, ForgotPasswordRequest } from '@acme/contracts';
import { useApiAction, useFormFields } from '@acme/web-utils';
import { TextField } from '@/components/form-fields';
import { Button, Card } from '@/components/ui';

export const ForgotPasswordForm = () => {
  const [sent, setSent] = useState(false);
  const { values, bind } = useFormFields<ForgotPasswordRequest>({ email: '' });
  const { run, pending, fieldErrors } = useApiAction<AcceptedResponse, ForgotPasswordRequest>(
    '/api/v1/auth/forgot-password',
    { onSuccess: () => setSent(true) },
  );

  if (sent) {
    return (
      <Card>
        <p role="status" className="text-sm text-slate-700">
          If an account exists for that email, a reset link is on its way. It is valid for 30
          minutes.
        </p>
        <Link href="/login" className="mt-4 block text-sm text-brand-600 hover:underline">
          Back to sign in
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
          void run(values);
        }}
      >
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          binding={bind('email')}
          error={fieldErrors['email']}
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Sending…' : 'Send reset link'}
        </Button>
        <Link href="/login" className="block text-center text-sm text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </form>
    </Card>
  );
};
