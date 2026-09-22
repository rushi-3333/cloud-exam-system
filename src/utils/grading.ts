export type PassStatus = 'pass' | 'fail';

export function computePercentage(marksObtained: number, totalMarks: number): number {
  if (totalMarks <= 0) return 0;
  return Math.round((marksObtained / totalMarks) * 100 * 100) / 100;
}

export function computePassStatus(
  marksObtained: number,
  totalMarks: number,
  passingPercentage: number
): PassStatus {
  const percentage = computePercentage(marksObtained, totalMarks);
  return percentage >= passingPercentage ? 'pass' : 'fail';
}
