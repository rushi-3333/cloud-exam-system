export function isValidExamWindow(startAtIso: string, endAtIso: string): boolean {
  return new Date(endAtIso).getTime() > new Date(startAtIso).getTime();
}
