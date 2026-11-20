'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '@acme/contracts';
import { Button } from '@/components/ui';

const FALLBACK_ERROR = 'The picture could not be saved';

const errorMessage = async (response: Response): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== 'object' || body === null || !('error' in body)) return FALLBACK_ERROR;
  const { error } = body;
  return typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
    ? error.message
    : FALLBACK_ERROR;
};

export const AvatarUpload = ({
  employeeId,
  hasAvatar,
}: {
  readonly employeeId: string;
  readonly hasAvatar: boolean;
}) => {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = `/api/v1/employees/${employeeId}/avatar`;

  const send = async (init: RequestInit): Promise<void> => {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(url, { credentials: 'same-origin', ...init });
      if (!response.ok) {
        setError(await errorMessage(response));
        return;
      }
      router.refresh();
    } catch {
      setError('The picture could not be saved');
    } finally {
      setPending(false);
      if (input.current) input.current.value = '';
    }
  };

  const onPick = (file: File | undefined): void => {
    if (!file) return;
    if (file.size > AVATAR_MAX_BYTES) {
      setError('The image must be 2 MB or smaller');
      return;
    }
    void send({ method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  };

  return (
    <div className="mt-3 space-y-2">
      <input
        ref={input}
        type="file"
        accept={AVATAR_MIME_TYPES.join(',')}
        className="sr-only"
        aria-label="Profile picture file"
        onChange={(event) => onPick(event.target.files?.[0])}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => input.current?.click()}
        >
          {hasAvatar ? 'Change picture' : 'Upload picture'}
        </Button>
        {hasAvatar && (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => void send({ method: 'DELETE' })}
          >
            Remove
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
