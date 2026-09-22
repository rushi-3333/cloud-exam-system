export function scoreBucketIndex(percentage: number): number {
  return Math.min(4, Math.floor(percentage / 20.0001));
}

export const SCORE_BUCKET_LABELS = ['0-20', '21-40', '41-60', '61-80', '81-100'];
