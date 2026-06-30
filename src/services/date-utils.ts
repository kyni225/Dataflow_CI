export function subDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
