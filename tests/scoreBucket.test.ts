import { describe, it, expect } from 'vitest';
import { scoreBucketIndex } from '@/utils/scoreBucket';

describe('scoreBucketIndex', () => {
  it('buckets 0% into the first bucket', () => {
    expect(scoreBucketIndex(0)).toBe(0);
  });

  it('buckets 20% into the first bucket (inclusive boundary)', () => {
    expect(scoreBucketIndex(20)).toBe(0);
  });

  it('buckets 21% into the second bucket', () => {
    expect(scoreBucketIndex(21)).toBe(1);
  });

  it('buckets 100% into the last bucket', () => {
    expect(scoreBucketIndex(100)).toBe(4);
  });

  it('buckets 99.99% into the last bucket', () => {
    expect(scoreBucketIndex(99.99)).toBe(4);
  });
});
