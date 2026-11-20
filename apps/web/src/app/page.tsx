import type { ReadyResponse } from '@acme/contracts';
import { httpRequest } from '@acme/web-utils';
import { apiUrl } from '@/lib/api-config';

export const dynamic = 'force-dynamic';

const fetchApiStatus = async (): Promise<ReadyResponse['status'] | 'unreachable'> => {
  try {
    const ready = await httpRequest<ReadyResponse>({ url: apiUrl('/health/ready') });
    return ready.status;
  } catch {
    return 'unreachable';
  }
};

const HomePage = async () => {
  const apiStatus = await fetchApiStatus();

  return (
    <main>
      <h1>ACME Salary Management</h1>
      <p>API status: {apiStatus}</p>
    </main>
  );
};

export default HomePage;
