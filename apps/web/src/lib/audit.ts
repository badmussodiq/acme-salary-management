import type { AuditAction, AuditEventDto, JsonValue } from '@acme/contracts';

type JsonObject = { readonly [key: string]: JsonValue };

const isObject = (value: JsonValue): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: JsonValue | undefined): string => {
  if (value === undefined || value === null) return '—';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

export const AUDIT_ACTION_LABELS: Readonly<Record<AuditAction, string>> = {
  'employee.created': 'Employee created',
  'employee.updated': 'Employee updated',
  'compensation.added': 'Compensation added',
  'employee.avatar_changed': 'Profile picture changed',
};

const describeUpdate = (before: JsonObject, after: JsonObject): string =>
  Object.keys(after)
    .map((key) => `${key}: ${text(before[key])} → ${text(after[key])}`)
    .join('; ');

const describeCompensation = (before: JsonValue, after: JsonObject): string => {
  const current = `${text(after['amount'])} ${text(after['currencyCode'])} (${text(after['payFrequency'])}) from ${text(after['effectiveFrom'])}`;
  return isObject(before)
    ? `${current}, replacing ${text(before['amount'])} ${text(before['currencyCode'])}`
    : current;
};

export const describeAuditEvent = (event: AuditEventDto): string => {
  if (!isObject(event.after)) return AUDIT_ACTION_LABELS[event.action];
  if (event.action === 'employee.updated') {
    return describeUpdate(isObject(event.before) ? event.before : {}, event.after);
  }
  if (event.action === 'employee.avatar_changed') {
    return event.after['hasAvatar'] === true ? 'Picture set' : 'Picture removed';
  }
  if (event.action === 'compensation.added') return describeCompensation(event.before, event.after);
  return `${text(event.after['firstName'])} ${text(event.after['lastName'])} (${text(event.after['employeeNumber'])})`;
};
