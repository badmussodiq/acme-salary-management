import { AppException } from '../common/app.exception';

export interface CompensationPeriod {
  readonly id: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
}

export interface CompensationChangePlan {
  readonly closeId: string | null;
}

export const planCompensationChange = (
  history: readonly CompensationPeriod[],
  effectiveFrom: string,
): CompensationChangePlan => {
  const latest = history.reduce<CompensationPeriod | undefined>(
    (best, period) => (!best || period.effectiveFrom > best.effectiveFrom ? period : best),
    undefined,
  );
  if (!latest) return { closeId: null };

  if (effectiveFrom <= latest.effectiveFrom) {
    throw new AppException(
      'CONFLICT',
      `Effective date must be after the latest compensation start date (${latest.effectiveFrom})`,
    );
  }
  if (latest.effectiveTo !== null && effectiveFrom < latest.effectiveTo) {
    throw new AppException(
      'CONFLICT',
      `Effective date overlaps an existing compensation period ending ${latest.effectiveTo}`,
    );
  }
  return { closeId: latest.effectiveTo === null ? latest.id : null };
};
