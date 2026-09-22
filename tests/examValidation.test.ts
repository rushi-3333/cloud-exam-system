import { describe, it, expect } from 'vitest';
import { isValidExamWindow } from '@/utils/examValidation';

describe('isValidExamWindow', () => {
  it('accepts a window where end is after start', () => {
    expect(isValidExamWindow('2026-01-01T09:00:00Z', '2026-01-01T10:00:00Z')).toBe(true);
  });

  it('rejects a window where end equals start', () => {
    expect(isValidExamWindow('2026-01-01T09:00:00Z', '2026-01-01T09:00:00Z')).toBe(false);
  });

  it('rejects a window where end is before start', () => {
    expect(isValidExamWindow('2026-01-01T10:00:00Z', '2026-01-01T09:00:00Z')).toBe(false);
  });

  it('accepts a window spanning multiple days', () => {
    expect(isValidExamWindow('2026-01-01T00:00:00Z', '2026-01-03T00:00:00Z')).toBe(true);
  });
});
