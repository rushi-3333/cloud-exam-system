import { describe, it, expect } from 'vitest';
import { computePercentage, computePassStatus } from '@/utils/grading';

describe('computePercentage', () => {
  it('computes a straightforward percentage', () => {
    expect(computePercentage(50, 100)).toBe(50);
  });

  it('rounds to 2 decimal places', () => {
    expect(computePercentage(2, 3)).toBe(66.67);
  });

  it('returns 0 when total marks is 0 (no questions)', () => {
    expect(computePercentage(0, 0)).toBe(0);
  });

  it('returns 100 for a perfect score', () => {
    expect(computePercentage(40, 40)).toBe(100);
  });
});

describe('computePassStatus', () => {
  it('passes when percentage meets the passing threshold exactly', () => {
    expect(computePassStatus(40, 100, 40)).toBe('pass');
  });

  it('fails when percentage is just below the threshold', () => {
    expect(computePassStatus(39, 100, 40)).toBe('fail');
  });

  it('passes when percentage exceeds the threshold', () => {
    expect(computePassStatus(85, 100, 40)).toBe('pass');
  });

  it('fails a zero score against any positive threshold', () => {
    expect(computePassStatus(0, 100, 1)).toBe('fail');
  });

  it('passes a zero score when threshold is also 0', () => {
    expect(computePassStatus(0, 100, 0)).toBe('pass');
  });
});
