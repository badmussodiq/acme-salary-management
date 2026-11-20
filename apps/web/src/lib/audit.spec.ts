import { describe, expect, it } from 'vitest';
import type { AuditEventDto } from '@acme/contracts';
import { describeAuditEvent } from './audit';

const event = (overrides: Partial<AuditEventDto>): AuditEventDto => ({
  id: '1',
  employeeId: 'e',
  actorEmail: 'hr@example.com',
  action: 'employee.updated',
  before: null,
  after: null,
  requestId: 'r',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('describeAuditEvent', () => {
  it('lists each changed field with old and new values', () => {
    const text = describeAuditEvent(
      event({
        before: { department: 'Sales', jobTitle: 'Rep' },
        after: { department: 'Legal', jobTitle: 'Counsel' },
      }),
    );

    expect(text).toBe('department: Sales → Legal; jobTitle: Rep → Counsel');
  });

  it('describes a new compensation and the one it replaced', () => {
    const text = describeAuditEvent(
      event({
        action: 'compensation.added',
        before: { amount: '100.00', currencyCode: 'USD' },
        after: {
          amount: '120.00',
          currencyCode: 'USD',
          payFrequency: 'annual',
          effectiveFrom: '2026-01-01',
        },
      }),
    );

    expect(text).toBe('120.00 USD (annual) from 2026-01-01, replacing 100.00 USD');
  });

  it('describes the first compensation without a predecessor', () => {
    const text = describeAuditEvent(
      event({
        action: 'compensation.added',
        before: null,
        after: {
          amount: '50.00',
          currencyCode: 'GBP',
          payFrequency: 'hourly',
          effectiveFrom: '2026-02-01',
        },
      }),
    );

    expect(text).toBe('50.00 GBP (hourly) from 2026-02-01');
  });

  it('names a created employee', () => {
    const text = describeAuditEvent(
      event({
        action: 'employee.created',
        after: { firstName: 'Ada', lastName: 'Lovelace', employeeNumber: 'EMP-000001' },
      }),
    );

    expect(text).toBe('Ada Lovelace (EMP-000001)');
  });

  it('falls back to the action label when there is no snapshot', () => {
    expect(describeAuditEvent(event({ action: 'employee.created', after: null }))).toBe(
      'Employee created',
    );
  });
});
