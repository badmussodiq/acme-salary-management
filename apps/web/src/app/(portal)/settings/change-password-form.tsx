'use client';

import type { AcceptedResponse, ChangePasswordRequest } from '@acme/contracts';
import { useApiAction, useFormFields } from '@acme/web-utils';
import { TextField } from '@/components/form-fields';
import { Button, Card } from '@/components/ui';

const EMPTY: ChangePasswordRequest = { currentPassword: '', newPassword: '' };

export const ChangePasswordForm = () => {
  const { values, bind, reset } = useFormFields<ChangePasswordRequest>(EMPTY);
  const { run, pending, fieldErrors } = useApiAction<AcceptedResponse, ChangePasswordRequest>(
    '/api/v1/auth/change-password',
    { successMessage: 'Password changed', onSuccess: () => reset() },
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
          label="Current password"
          type="password"
          autoComplete="current-password"
          binding={bind('currentPassword')}
          error={fieldErrors['currentPassword']}
        />
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          binding={bind('newPassword')}
          error={fieldErrors['newPassword']}
          hint="At least 12 characters."
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Saving…' : 'Change password'}
        </Button>
      </form>
    </Card>
  );
};
