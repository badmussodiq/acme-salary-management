'use client';

import { useRouter } from 'next/navigation';
import { useApiAction } from '@acme/web-utils';
import { Button } from '@/components/ui';

export const LogoutButton = () => {
  const router = useRouter();
  const { run, pending } = useApiAction<{ loggedOut: true }>('/api/v1/auth/logout', {
    onSuccess: () => {
      router.replace('/login');
      router.refresh();
    },
  });

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => {
        void run(undefined);
      }}
    >
      Sign out
    </Button>
  );
};
