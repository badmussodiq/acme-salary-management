'use client';

import { useRouter } from 'next/navigation';
import type { LoginRequest, SessionUser } from '@acme/contracts';
import { useApiAction, useFormFields } from '@acme/web-utils';
import { TextField } from '@/components/form-fields';
import { Button, Card } from '@/components/ui';

export const LoginForm = () => {
  const router = useRouter();
  const { values, bind } = useFormFields<LoginRequest>({ email: '', password: '' });
  const { run, pending, fieldErrors } = useApiAction<SessionUser, LoginRequest>(
    '/api/v1/auth/login',
    {
      onSuccess: () => {
        router.replace('/dashboard');
        router.refresh();
      },
    },
  );

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
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          binding={bind('password')}
          error={fieldErrors['password']}
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Card>
  );
};
