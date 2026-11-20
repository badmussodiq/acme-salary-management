import { describe, expect, it } from 'vitest';
import { AppException } from '../common/app.exception';
import { planCompensationChange, type CompensationPeriod } from './compensation.rules';

const open = (id: string, effectiveFrom: string): CompensationPeriod => ({
  id,
  effectiveFrom,
  effectiveTo: null,
});

describe('planCompensationChange', () => {
  it('has nothing to close for the first compensation', () => {
    expect(planCompensationChange([], '2026-01-01')).toEqual({ closeId: null });
  });

  it('closes the open period when a later one starts', () => {
    const history = [
      { id: 'old', effectiveFrom: '2024-01-01', effectiveTo: '2025-01-01' },
      open('current', '2025-01-01'),
    ];

    expect(planCompensationChange(history, '2026-03-01')).toEqual({ closeId: 'current' });
  });

  it('rejects a start date on or before the latest start date', () => {
    const history = [open('current', '2025-01-01')];

    expect(() => planCompensationChange(history, '2025-01-01')).toThrow(AppException);
    expect(() => planCompensationChange(history, '2024-06-01')).toThrow(
      'Effective date must be after the latest compensation start date (2025-01-01)',
    );
  });

  it('rejects a start date inside an already-closed latest period', () => {
    const history = [{ id: 'closed', effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31' }];

    expect(() => planCompensationChange(history, '2025-06-01')).toThrow('overlaps');
  });

  it('does not close an already-closed period when starting after it ended', () => {
    const history = [{ id: 'closed', effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31' }];

    expect(planCompensationChange(history, '2026-01-01')).toEqual({ closeId: null });
  });

  it('picks the latest period regardless of input order', () => {
    const history = [
      open('b', '2025-06-01'),
      { id: 'a', effectiveFrom: '2024-01-01', effectiveTo: '2025-06-01' },
    ];

    expect(planCompensationChange(history, '2026-01-01')).toEqual({ closeId: 'b' });
  });
});
